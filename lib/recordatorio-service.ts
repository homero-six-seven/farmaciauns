/**
 * Envío inmediato del recordatorio al confirmar una reserva con menos de 24
 * horas de anticipación (US-32 CA3). El recordatorio de las reservas con más
 * de un día de margen sigue a cargo del cron (`/api/cron/turno-reminders`).
 *
 * Nunca bloquea la reserva: si el envío falla, el turno queda sin
 * `recordatorioEnviadoAt` y el cron lo reintenta mientras siga en ventana.
 */

import { getPrisma } from "./prisma";
import { estaEnVentanaRecordatorio } from "./domain/recordatorio";
import { instanteDeTurno } from "./domain/turno";
import { aFechaISO } from "./fecha-db";
import { sendAppointmentReminderEmail } from "./email";

const MINUTOS_PARA_REINTENTAR = 10;

/**
 * Intenta enviar AHORA el recordatorio de un turno recién reservado si está
 * dentro de la ventana de 24 horas (CA3). Devuelve `true` solo si el email se
 * envió y quedó registrado. En cualquier otro caso (no aplica, ya enviado, o
 * fallo de SMTP) devuelve `false` y el cron lo cubre después.
 */
export async function enviarRecordatorioInmediato(
  turnoId: string,
  ahora: Date,
): Promise<boolean> {
  const prisma = getPrisma();

  const turno = await prisma.turno.findFirst({
    where: { id: turnoId, estado: "RESERVADO", recordatorioEnviadoAt: null },
    select: {
      id: true,
      tipo: true,
      fecha: true,
      inicioMin: true,
      estado: true,
      paciente: { select: { email: true, firstName: true, lastName: true } },
    },
  });
  if (!turno?.paciente.email) {
    return false;
  }
  if (
    !estaEnVentanaRecordatorio(
      { fecha: aFechaISO(turno.fecha), inicioMin: turno.inicioMin, estado: turno.estado },
      ahora,
    )
  ) {
    return false;
  }

  // Reclama el turno igual que el cron, para no duplicar el envío si ambos
  // corren a la vez.
  const reintentarDesde = new Date(ahora.getTime() - MINUTOS_PARA_REINTENTAR * 60_000);
  const reclamo = await prisma.turno.updateMany({
    where: {
      id: turno.id,
      estado: "RESERVADO",
      recordatorioEnviadoAt: null,
      OR: [
        { recordatorioProcesandoAt: null },
        { recordatorioProcesandoAt: { lt: reintentarDesde } },
      ],
    },
    data: { recordatorioProcesandoAt: ahora },
  });
  if (reclamo.count === 0) {
    return false;
  }

  try {
    await sendAppointmentReminderEmail({
      email: turno.paciente.email,
      nombre: `${turno.paciente.firstName ?? ""} ${turno.paciente.lastName ?? ""}`.trim(),
      fechaHora: instanteDeTurno(aFechaISO(turno.fecha), turno.inicioMin),
      tipo: turno.tipo,
    });
  } catch (error) {
    await prisma.turno.updateMany({
      where: { id: turno.id, recordatorioEnviadoAt: null },
      data: { recordatorioProcesandoAt: null },
    });
    console.error(
      `Failed to send immediate appointment reminder for turn ${turno.id}.`,
      error,
    );
    return false;
  }

  await prisma.turno.update({
    where: { id: turno.id },
    data: { recordatorioEnviadoAt: new Date(), recordatorioProcesandoAt: null },
  });
  return true;
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { requirePaciente } from "@/lib/authorization";
import type { FormState } from "@/lib/form-state";
import { enviarRecordatorioInmediato } from "@/lib/recordatorio-service";
import { reservarTurno } from "@/lib/turno-service";

function leerString(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * US-29 (RF-02) — Confirmar la reserva de un turno.
 *
 * El paciente sale de la sesión; del formulario solo llegan médico, fecha y
 * hora, que el servicio vuelve a validar contra la agenda. Si el horario ya no
 * está disponible (CA2) o el paciente ya tiene un turno que se superpone (CA3),
 * refresca la página para mostrar los horarios actualizados y devuelve el
 * mensaje.
 */
export async function confirmarReserva(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  const paciente = await requirePaciente();

  let turnoId: string;
  try {
    const turno = await reservarTurno(
      {
        pacienteId: paciente.id,
        medicoId: leerString(formData, "medicoId"),
        fecha: leerString(formData, "fecha"),
        inicioMin: Number(leerString(formData, "inicioMin")),
      },
      new Date(),
    );
    turnoId = turno.id;
  } catch (error) {
    if (error instanceof ApiError) {
      revalidatePath("/turnos/reservar");
      return { errors: { _form: error.message } };
    }
    console.error("Failed to book an appointment.", error);
    return { errors: { _form: "No se pudo reservar el turno. Intentá nuevamente." } };
  }

  // US-32 CA3: reserva con menos de 24h → el recordatorio sale en el momento.
  // Si el envío falla, el cron lo reintenta; nunca bloquea la reserva.
  try {
    await enviarRecordatorioInmediato(turnoId, new Date());
  } catch (error) {
    console.error("Failed to send an immediate reminder after booking.", error);
  }

  revalidatePath("/turnos", "layout");
  revalidatePath("/medico/agenda", "layout");
  redirect(`/turnos/reservar?reservado=${encodeURIComponent(turnoId)}`);
}

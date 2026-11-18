"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import type { FormState } from "@/lib/form-state";
import { enviarRecordatorioInmediato } from "@/lib/recordatorio-service";
import { reservarTurnoVacunacion } from "@/lib/vacunacion-service";

function leerString(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/**
 * US-33 (RF-04b) — Confirmar la asignación de un turno de vacunación.
 *
 * La enfermera sale de la sesión; del formulario solo llegan paciente, vacuna,
 * fecha y hora, que el servicio vuelve a validar (stock, horario libre y
 * conflictos del paciente). Si algo ya no está disponible, refresca la página
 * para mostrar la disponibilidad actualizada.
 */
export async function confirmarAsignacion(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  await requireRole(["enfermera"]);

  let turnoId: string;
  try {
    const turno = await reservarTurnoVacunacion(
      {
        pacienteId: leerString(formData, "pacienteId"),
        vacunaId: leerString(formData, "vacunaId"),
        fecha: leerString(formData, "fecha"),
        inicioMin: Number(leerString(formData, "inicioMin")),
      },
      new Date(),
    );
    turnoId = turno.id;
  } catch (error) {
    if (error instanceof ApiError) {
      revalidatePath("/turnos-vacunacion/asignar");
      return { errors: { _form: error.message } };
    }
    console.error("Failed to book a vaccination appointment.", error);
    return { errors: { _form: "No se pudo asignar el turno. Intentá nuevamente." } };
  }

  // US-32 CA3: reserva con menos de 24h → el recordatorio sale en el momento.
  // Si el envío falla, el cron lo reintenta; nunca bloquea la reserva.
  try {
    await enviarRecordatorioInmediato(turnoId, new Date());
  } catch (error) {
    console.error("Failed to send an immediate reminder after booking.", error);
  }

  revalidatePath("/turnos-vacunacion", "layout");
  revalidatePath("/turnos", "layout"); // "Mis turnos" del paciente (US-30 CA4)
  revalidatePath("/stock", "layout"); // el stock cambió (US-36)
  redirect(`/turnos-vacunacion/asignar?reservado=${encodeURIComponent(turnoId)}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import type { FormState } from "@/lib/form-state";
import { cancelarTurnoVacunacion } from "@/lib/vacunacion-service";

/**
 * US-35 (RF-04b) — Cancelar un turno de vacunación futuro. Libera el horario y
 * devuelve la dosis al stock (sin tope de 50). La enfermera sale de la sesión;
 * del formulario solo llega el id del turno, que el servicio vuelve a validar.
 */
export async function cancelarTurnoDeVacunacion(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  await requireRole(["enfermera"]);

  const turnoId = String(formData.get("turnoId") ?? "").trim();
  try {
    await cancelarTurnoVacunacion(turnoId, new Date());
  } catch (error) {
    if (error instanceof ApiError) {
      revalidatePath("/turnos-vacunacion");
      return { errors: { _form: error.message } };
    }
    console.error("Failed to cancel a vaccination appointment.", error);
    return { errors: { _form: "No se pudo cancelar el turno. Intentá nuevamente." } };
  }

  revalidatePath("/turnos-vacunacion", "layout");
  revalidatePath("/turnos", "layout"); // "Anteriores" del paciente (US-35 CA3)
  revalidatePath("/stock", "layout"); // la dosis volvió al stock (US-36)
  return { errors: {}, values: { ok: "1" } };
}

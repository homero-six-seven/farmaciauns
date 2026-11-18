"use server";

import { revalidatePath } from "next/cache";
import { ApiError } from "@/lib/api";
import { requireRole } from "@/lib/authorization";
import { hoyEnArgentina } from "@/lib/domain/agenda";
import type { FormState } from "@/lib/form-state";
import {
  cancelarTurnoVacunacion,
  marcarAusenteVacunacion,
  marcarVacunaAplicada,
} from "@/lib/vacunacion-service";

function leerTurnoId(formData: FormData): string {
  return String(formData.get("turnoId") ?? "").trim();
}

function revalidarListas(): void {
  revalidatePath("/turnos-vacunacion", "layout");
  revalidatePath("/turnos", "layout"); // "Mis turnos" del paciente (US-30/35/60)
  revalidatePath("/stock", "layout"); // el stock puede cambiar (US-36)
}

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

  try {
    await cancelarTurnoVacunacion(leerTurnoId(formData), new Date());
  } catch (error) {
    if (error instanceof ApiError) {
      revalidatePath("/turnos-vacunacion");
      return { errors: { _form: error.message } };
    }
    console.error("Failed to cancel a vaccination appointment.", error);
    return { errors: { _form: "No se pudo cancelar el turno. Intentá nuevamente." } };
  }

  revalidarListas();
  return { errors: {}, values: { ok: "1" } };
}

/**
 * US-60 (RF-04b) — Registrar la aplicación de la vacuna: el turno pasa a
 * "Atendido" y el stock NO cambia (la dosis ya se descontó al reservar).
 */
export async function registrarVacunaAplicada(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(["enfermera"]);

  try {
    await marcarVacunaAplicada(leerTurnoId(formData), hoyEnArgentina(new Date()));
  } catch (error) {
    if (error instanceof ApiError) {
      revalidatePath("/turnos-vacunacion");
      return { errors: { _form: error.message } };
    }
    console.error("Failed to register a vaccine application.", error);
    return { errors: { _form: "No se pudo registrar la aplicación. Intentá nuevamente." } };
  }

  revalidarListas();
  return { errors: {}, values: { ok: "1" } };
}

/**
 * US-60 (RF-04b) — Registrar la ausencia del paciente: el turno pasa a
 * "Ausente" y la dosis vuelve al stock (sin tope de 50, como US-35).
 */
export async function registrarAusenciaVacunacion(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireRole(["enfermera"]);

  try {
    await marcarAusenteVacunacion(leerTurnoId(formData), hoyEnArgentina(new Date()));
  } catch (error) {
    if (error instanceof ApiError) {
      revalidatePath("/turnos-vacunacion");
      return { errors: { _form: error.message } };
    }
    console.error("Failed to register a vaccination absence.", error);
    return { errors: { _form: "No se pudo registrar la ausencia. Intentá nuevamente." } };
  }

  revalidarListas();
  return { errors: {}, values: { ok: "1" } };
}

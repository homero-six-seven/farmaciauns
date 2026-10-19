"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  diaSemanaDe,
  etiquetaDia,
  formatearHora,
  franjasSinTurnos,
  hoyEnArgentina,
  validarDuracion,
} from "@/lib/domain/agenda";
import {
  guardarDuracionTurno as guardarDuracionTurnoEnDb,
  listarFranjasDesde,
} from "@/lib/agenda-repository";
import { requireMedico } from "@/lib/authorization";
import type { FormState } from "@/lib/form-state";

const RUTA_DISPONIBILIDAD = "/medico/agenda/disponibilidad";

function leerString(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

/** Conserva el mes elegido en la URL al volver a la pantalla. */
function urlDisponibilidad(mes: string, guardado: string): string {
  const params = new URLSearchParams({ guardado });
  if (/^\d{4}-\d{2}$/.test(mes)) {
    params.set("mes", mes);
  }
  return `${RUTA_DISPONIBILIDAD}?${params.toString()}`;
}

/**
 * US-25 (RF-01) — Definir la duración de los turnos.
 *
 * Guarda la duración y la aplica a las franjas de hoy en adelante; las fechas
 * pasadas conservan la que tenían. Si alguna franja futura deja de admitir un
 * turno completo con la nueva duración, rechaza el cambio y las lista.
 */
export async function guardarDuracionTurno(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  const medico = await requireMedico();

  const valorIngresado = leerString(formData, "duracionTurnoMin");
  const mes = leerString(formData, "mes");
  const duracionTurnoMin = Number(valorIngresado);

  const errorDuracion = validarDuracion(duracionTurnoMin);
  if (errorDuracion) {
    return {
      errors: { duracionTurnoMin: errorDuracion },
      values: { duracionTurnoMin: valorIngresado },
    };
  }

  const hoy = hoyEnArgentina(new Date());

  try {
    const conflictos = franjasSinTurnos(
      await listarFranjasDesde(medico.id, hoy),
      duracionTurnoMin,
    );
    if (conflictos.length > 0) {
      // Una misma franja del patrón se repite cada semana: se lista una vez.
      const bloques = [
        ...new Set(
          conflictos.map(
            (f) =>
              `${etiquetaDia(diaSemanaDe(f.fecha))} ${formatearHora(f.inicioMin)} - ${formatearHora(f.finMin)}`,
          ),
        ),
      ];
      return {
        errors: {
          duracionTurnoMin: `Con turnos de ${duracionTurnoMin} min, estas franjas no alcanzan para un turno: ${bloques.join(", ")}. Modificalas antes de cambiar la duración.`,
        },
        values: { duracionTurnoMin: valorIngresado },
      };
    }

    await guardarDuracionTurnoEnDb(medico.id, duracionTurnoMin, hoy);
  } catch (error) {
    console.error("Failed to save the appointment duration.", error);
    return {
      errors: {
        _form: "No se pudo guardar la duración. Intentá nuevamente.",
      },
      values: { duracionTurnoMin: valorIngresado },
    };
  }

  revalidatePath("/medico/agenda", "layout");
  redirect(urlDisponibilidad(mes, "duracion"));
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MSG_MES_FUERA_DE_RANGO,
  MSG_SIN_DURACION,
  diaSemanaDe,
  esMesHabilitado,
  etiquetaDia,
  expandirMes,
  formatearHora,
  franjasSinTurnos,
  hoyEnArgentina,
  parsearMes,
  primerDiaDelMes,
  ultimoDiaDelMes,
  validarDuracion,
  validarFranjas,
  type FranjaEntrada,
} from "@/lib/domain/agenda";
import {
  guardarDuracionTurno as guardarDuracionTurnoEnDb,
  listarFranjasDesde,
  obtenerDuracionTurno,
  reemplazarFranjas,
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

/** Lee el JSON de franjas del editor. `null` si no tiene la forma esperada. */
function leerFranjas(valor: string): FranjaEntrada[] | null {
  let datos: unknown;
  try {
    datos = JSON.parse(valor);
  } catch {
    return null;
  }
  if (!Array.isArray(datos)) {
    return null;
  }
  const franjas: FranjaEntrada[] = [];
  for (const item of datos) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof item.diaSemana !== "number" ||
      typeof item.inicio !== "string" ||
      typeof item.fin !== "string"
    ) {
      return null;
    }
    franjas.push({ diaSemana: item.diaSemana, inicio: item.inicio, fin: item.fin });
  }
  return franjas;
}

/**
 * US-26 y US-28 (RF-01) — Guardar la disponibilidad de un mes.
 *
 * Recibe el patrón semanal del editor, lo valida con las mismas reglas que el
 * cliente y lo expande a las fechas del mes de hoy en adelante. En una
 * transacción reemplaza solo ese rango: las fechas pasadas no se tocan.
 */
export async function guardarDisponibilidad(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  const medico = await requireMedico();

  const mesIngresado = leerString(formData, "mes");
  const hoy = hoyEnArgentina(new Date());
  const mes = parsearMes(mesIngresado);
  if (!mes || !esMesHabilitado(mes, hoy)) {
    return { errors: { _form: MSG_MES_FUERA_DE_RANGO } };
  }

  const entradas = leerFranjas(leerString(formData, "franjas"));
  if (!entradas) {
    return {
      errors: { _form: "No se pudieron leer las franjas enviadas. Recargá la página e intentá nuevamente." },
    };
  }

  // Desde hoy si el mes ya empezó; si no, desde el día 1.
  const primerDia = primerDiaDelMes(mes);
  const rango = { desde: hoy > primerDia ? hoy : primerDia, hasta: ultimoDiaDelMes(mes) };

  try {
    const duracionTurnoMin = await obtenerDuracionTurno(medico.id);
    if (duracionTurnoMin === null) {
      return { errors: { _form: MSG_SIN_DURACION } };
    }

    const resultado = validarFranjas(entradas, duracionTurnoMin);
    if (!resultado.ok) {
      const [indice, mensaje] = Object.entries(resultado.errores)[0];
      return {
        errors: { _form: `Revisá la franja ${Number(indice) + 1}: ${mensaje}` },
      };
    }

    await reemplazarFranjas(
      medico.id,
      rango,
      expandirMes(mes, resultado.franjas, rango.desde),
      duracionTurnoMin,
    );
  } catch (error) {
    console.error("Failed to save the monthly availability.", error);
    return {
      errors: { _form: "No se pudo guardar la disponibilidad. Intentá nuevamente." },
    };
  }

  revalidatePath("/medico/agenda", "layout");
  redirect(urlDisponibilidad(mesIngresado, "franjas"));
}

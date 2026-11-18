/**
 * Dominio de "Turnos de vacunación" (Sprint 3: US-33, US-34, US-35 y US-60) —
 * tipos y reglas PURAS, sin I/O, igual que `agenda.ts` y `turno.ts`.
 *
 * Convenciones compartidas: fechas como `FechaISO` ("YYYY-MM-DD") y horas como
 * minutos desde las 00:00, en hora de Argentina.
 *
 * El vacunatorio es un recurso GLOBAL (no hay una enfermera dueña del horario):
 * los slots son de 15 minutos, de lunes a viernes de 08:00 a 18:00. No se
 * persisten: los horarios libres se calculan restando los turnos no cancelados,
 * igual que la agenda médica calcula los suyos desde las franjas.
 */

import type { FechaISO } from "./agenda";
import {
  MSG_TURNO_NO_CANCELABLE,
  esFuturo,
  puedeCerrarse,
  seSuperponen,
  type EstadoTurno,
  type Horario,
  type TipoTurno,
} from "./turno";

// ---------------------------------------------------------------------------
// Constantes del vacunatorio (US-33: "turnos de 15 minutos, de lunes a
// viernes de 8:00 a 18:00").
// ---------------------------------------------------------------------------

export const DURACION_TURNO_VACUNACION_MIN = 15;
export const INICIO_VACUNATORIO_MIN = 480; // 08:00
export const FIN_VACUNATORIO_MIN = 1080; // 18:00

/** US-34 CA2: mensaje cuando un día no tiene turnos de vacunación. */
export const MSG_SIN_TURNOS_VACUNACION = "No hay turnos de vacunación para este día";
/** US-33 CA2: indicación de una vacuna sin unidades disponibles. */
export const MSG_SIN_STOCK = "Sin stock";
/** Búsqueda de pacientes de la asignación sin resultados. */
export const MSG_PACIENTE_NO_ENCONTRADO = "No se encontraron pacientes";

/** True si `valor` es una fecha "YYYY-MM-DD" válida de calendario. */
export function esFechaISO(valor: string): valor is FechaISO {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const [anio, mes, dia] = valor.split("-").map(Number);
  if (mes < 1 || mes > 12) {
    return false;
  }
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
}

/** `fecha` desplazada `cantidad` días calendario (para la navegación de día). */
export function sumarDias(fecha: FechaISO, cantidad: number): FechaISO {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaNueva = new Date(Date.UTC(anio, mes - 1, dia + cantidad));
  const mesNuevo = String(fechaNueva.getUTCMonth() + 1).padStart(2, "0");
  const diaNuevo = String(fechaNueva.getUTCDate()).padStart(2, "0");
  return `${fechaNueva.getUTCFullYear()}-${mesNuevo}-${diaNuevo}`;
}

/** El primer día hábil (lunes a viernes) posterior a `fecha`. */
export function proximoDiaHabil(fecha: FechaISO): FechaISO {
  let siguiente = sumarDias(fecha, 1);
  while (!esDiaHabilVacunacion(siguiente)) {
    siguiente = sumarDias(siguiente, 1);
  }
  return siguiente;
}

/** El día hábil (lunes a viernes) anterior a `fecha`. */
export function diaHabilAnterior(fecha: FechaISO): FechaISO {
  let anterior = sumarDias(fecha, -1);
  while (!esDiaHabilVacunacion(anterior)) {
    anterior = sumarDias(anterior, -1);
  }
  return anterior;
}

/** True si la fecha es un día hábil (lunes a viernes). */
export function esDiaHabilVacunacion(fecha: FechaISO): boolean {
  const dia = new Date(`${fecha}T00:00:00Z`).getUTCDay();
  return dia >= 1 && dia <= 5;
}

/**
 * Todos los slots de vacunación de un día hábil; `[]` los fines de semana.
 * Cada slot dura exactamente 15 minutos y el último termina a las 18:00.
 */
export function grillaVacunacion(fecha: FechaISO): Horario[] {
  if (!esDiaHabilVacunacion(fecha)) {
    return [];
  }
  const horarios: Horario[] = [];
  for (
    let inicio = INICIO_VACUNATORIO_MIN;
    inicio + DURACION_TURNO_VACUNACION_MIN <= FIN_VACUNATORIO_MIN;
    inicio += DURACION_TURNO_VACUNACION_MIN
  ) {
    horarios.push({ fecha, inicioMin: inicio, finMin: inicio + DURACION_TURNO_VACUNACION_MIN });
  }
  return horarios;
}

/**
 * Horarios libres de un día (US-33 CA3): la grilla menos los que se superponen
 * con un turno ocupado (no cancelado) y menos los que ya empezaron.
 */
export function horariosVacunacionLibres(
  fecha: FechaISO,
  ocupados: Horario[],
  ahora: Date,
): Horario[] {
  return grillaVacunacion(fecha)
    .filter((h) => esFuturo(h, ahora))
    .filter((h) => !ocupados.some((o) => seSuperponen(h, o)));
}

// ---------------------------------------------------------------------------
// US-35 — Cancelación por la enfermera
// ---------------------------------------------------------------------------

/**
 * Motivo por el que la enfermera no puede cancelar el turno, o `null` si
 * puede. Solo turnos de vacunación reservados que todavía no empezaron
 * ("cada turno futuro tiene el botón Cancelar").
 */
export function motivoTurnoVacunacionNoCancelable(
  turno: { tipo: TipoTurno; estado: EstadoTurno; fecha: FechaISO; inicioMin: number },
  ahora: Date,
): string | null {
  if (turno.tipo !== "VACUNACION" || turno.estado !== "RESERVADO" || !esFuturo(turno, ahora)) {
    return MSG_TURNO_NO_CANCELABLE;
  }
  return null;
}

// ---------------------------------------------------------------------------
// US-60 — Registrar aplicación o ausencia
// ---------------------------------------------------------------------------

/**
 * "Vacuna aplicada" y "Ausente" solo se ofrecen en turnos de vacunación
 * reservados de hoy o de días anteriores (misma regla de cierre que US-40/41).
 */
export function puedeRegistrarAplicacionOAusencia(
  turno: { tipo: TipoTurno; estado: EstadoTurno; fecha: FechaISO },
  hoy: FechaISO,
): boolean {
  return turno.tipo === "VACUNACION" && puedeCerrarse({ estado: turno.estado, fecha: turno.fecha }, hoy);
}

// ---------------------------------------------------------------------------
// Movimientos de dosis (stock), sin tope en las devoluciones
// ---------------------------------------------------------------------------

/**
 * Stock tras reservar un turno (US-33): se descuenta 1 unidad si hay stock;
 * `null` si no hay dosis disponibles (CA2: opción "Sin stock").
 */
export function stockTrasReservarDosis(stock: number): number | null {
  return stock > 0 ? stock - 1 : null;
}

/**
 * Stock tras devolver una dosis (US-35 CA4 y US-60 CA2): suma 1 SIN tope de
 * 50, porque el máximo solo se controla al registrar ingresos (US-22).
 */
export function stockTrasDevolverDosis(stock: number): number {
  return stock + 1;
}

/**
 * Dominio de la agenda médica (RF-01, US-25 a US-28) — tipos y reglas PURAS.
 *
 * Igual que `usuario.ts`: acá NO hay I/O (ni Next.js, ni Prisma, ni
 * `process.env`). Todo es determinista y se puede usar tanto en el servidor
 * (server actions) como en el cliente (validación en vivo del editor).
 *
 * Convenciones de representación (evitan errores de zona horaria):
 * - Fechas: día calendario como texto `"YYYY-MM-DD"` (`FechaISO`). Se comparan
 *   como strings y se calculan con `Date.UTC`, nunca con la hora local.
 * - Horas: minutos desde las 00:00 como entero (`"08:20"` ↔ `500`), siempre en
 *   hora de Argentina.
 * - Días de la semana: numeración ISO, 1 = lunes … 7 = domingo.
 */

import { MSG_CAMPO_OBLIGATORIO } from "./usuario";

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

/** Día calendario en formato `"YYYY-MM-DD"`. */
export type FechaISO = string;

/** Día de la semana ISO: 1 = lunes … 7 = domingo. */
export type DiaSemana = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Mes de agenda; `mes` va de 1 a 12. */
export interface MesAgenda {
  anio: number;
  mes: number;
}

/** Franja del patrón semanal que carga el médico para un mes. */
export interface FranjaSemanal {
  diaSemana: DiaSemana;
  inicioMin: number;
  finMin: number;
}

/** Franja con fecha concreta (lo que se persiste en `FranjaHoraria`). */
export interface FranjaConFecha {
  fecha: FechaISO;
  inicioMin: number;
  finMin: number;
}

/** Fila del editor tal como llega del formulario (sin validar). */
export interface FranjaEntrada {
  diaSemana: number;
  inicio: string;
  fin: string;
}

/** Índice de fila del editor → mensaje de error. */
export type ErroresFranjas = Record<number, string>;

export type ResultadoValidacionFranjas =
  | { ok: true; franjas: FranjaSemanal[] }
  | { ok: false; errores: ErroresFranjas };

export interface Turno {
  inicioMin: number;
  finMin: number;
}

// ---------------------------------------------------------------------------
// Constantes de negocio (decisiones del grupo, 19/10/2026)
// ---------------------------------------------------------------------------

export const DURACION_MIN = 5;
export const DURACION_MAX = 120;
/** Granularidad de duraciones y horarios, en minutos. */
export const PASO_MINUTOS = 5;
/** Accesos rápidos del wireframe de US-25. */
export const DURACIONES_COMUNES = [15, 20, 30, 45] as const;
/** Meses posteriores al actual en los que se puede cargar disponibilidad. */
export const MESES_HACIA_ADELANTE = 5;
export const ZONA_HORARIA_CLINICA = "America/Argentina/Buenos_Aires";

export const DIAS_SEMANA: readonly { valor: DiaSemana; etiqueta: string }[] = [
  { valor: 1, etiqueta: "Lunes" },
  { valor: 2, etiqueta: "Martes" },
  { valor: 3, etiqueta: "Miércoles" },
  { valor: 4, etiqueta: "Jueves" },
  { valor: 5, etiqueta: "Viernes" },
  { valor: 6, etiqueta: "Sábado" },
  { valor: 7, etiqueta: "Domingo" },
];

const NOMBRES_MES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

// ---------------------------------------------------------------------------
// Mensajes de error
// ---------------------------------------------------------------------------

export const MSG_DURACION_INVALIDA = `La duración debe ser un número entero entre ${DURACION_MIN} y ${DURACION_MAX} minutos, en múltiplos de ${PASO_MINUTOS}`;
export const MSG_SIN_DURACION = "Primero definí la duración de tus turnos";
export const MSG_DIA_INVALIDO = "Seleccioná un día de la semana";
export const MSG_HORA_FORMATO = "Ingresá una hora válida (HH:MM)";
export const MSG_HORA_MULTIPLO = `Las horas deben ser múltiplos de ${PASO_MINUTOS} minutos`;
export const MSG_FIN_ANTES_DE_INICIO =
  "La hora de fin debe ser posterior a la de inicio";
/** Texto del wireframe de US-26/US-28. */
export const MSG_FRANJA_SUPERPUESTA =
  "Esta franja se superpone con otra del mismo día";
export const MSG_MES_FUERA_DE_RANGO = `Elegí un mes entre el actual y los próximos ${MESES_HACIA_ADELANTE}`;

export function mensajeFranjaSinTurnos(duracionTurnoMin: number): string {
  return `La franja debe permitir al menos un turno de ${duracionTurnoMin} min`;
}

// ---------------------------------------------------------------------------
// Horas
// ---------------------------------------------------------------------------

/** `"08:20"` → `500`. Devuelve `null` si no es una hora `HH:MM` válida. */
export function parsearHora(valor: string): number | null {
  const coincidencia = /^(\d{2}):(\d{2})$/.exec(valor.trim());
  if (!coincidencia) {
    return null;
  }
  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) {
    return null;
  }
  return horas * 60 + minutos;
}

/** `500` → `"08:20"`. */
export function formatearHora(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return `${String(horas).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

export function etiquetaDia(dia: DiaSemana): string {
  return DIAS_SEMANA[dia - 1].etiqueta;
}

function esDiaSemana(valor: number): valor is DiaSemana {
  return Number.isInteger(valor) && valor >= 1 && valor <= 7;
}

// ---------------------------------------------------------------------------
// Duración de turnos (US-25)
// ---------------------------------------------------------------------------

/** Devuelve el mensaje de error, o `null` si la duración es válida. */
export function validarDuracion(duracionTurnoMin: number): string | null {
  const valida =
    Number.isInteger(duracionTurnoMin) &&
    duracionTurnoMin >= DURACION_MIN &&
    duracionTurnoMin <= DURACION_MAX &&
    duracionTurnoMin % PASO_MINUTOS === 0;
  return valida ? null : MSG_DURACION_INVALIDA;
}

/**
 * Corta una franja en turnos consecutivos de `duracionTurnoMin`. Los minutos
 * que no alcanzan para un turno completo se descartan y se informan en
 * `sobranteMin` (el editor avisa "quedan N min sin turno").
 */
export function generarTurnos(
  franja: { inicioMin: number; finMin: number },
  duracionTurnoMin: number,
): { turnos: Turno[]; sobranteMin: number } {
  const turnos: Turno[] = [];
  let inicio = franja.inicioMin;
  while (inicio + duracionTurnoMin <= franja.finMin) {
    turnos.push({ inicioMin: inicio, finMin: inicio + duracionTurnoMin });
    inicio += duracionTurnoMin;
  }
  return { turnos, sobranteMin: franja.finMin - inicio };
}

/**
 * Franjas que dejarían de admitir un turno con la nueva duración. Se usa al
 * cambiar la duración (US-25): si devuelve algo, el cambio se rechaza.
 */
export function franjasSinTurnos<T extends { inicioMin: number; finMin: number }>(
  franjas: T[],
  duracionTurnoMin: number,
): T[] {
  return franjas.filter((f) => f.finMin - f.inicioMin < duracionTurnoMin);
}

// ---------------------------------------------------------------------------
// Validación del editor de franjas (US-26 / US-28)
// ---------------------------------------------------------------------------

function validarHora(valor: string): { minutos: number } | { error: string } {
  if (valor.trim() === "") {
    return { error: MSG_CAMPO_OBLIGATORIO };
  }
  const minutos = parsearHora(valor);
  if (minutos === null) {
    return { error: MSG_HORA_FORMATO };
  }
  if (minutos % PASO_MINUTOS !== 0) {
    return { error: MSG_HORA_MULTIPLO };
  }
  return { minutos };
}

function seSuperponen(a: FranjaSemanal, b: FranjaSemanal): boolean {
  // Franjas que solo se tocan (12:00 y 12:00) no se superponen.
  return a.diaSemana === b.diaSemana && a.inicioMin < b.finMin && b.inicioMin < a.finMin;
}

/**
 * Valida las filas del editor. Primero cada fila por separado (día, formato,
 * múltiplos de 5, fin > inicio, al menos un turno) y después la superposición
 * entre filas válidas del mismo día; el error queda en la fila que aparece
 * después. Una lista vacía es válida: cierra la agenda por lo que queda del mes.
 */
export function validarFranjas(
  entradas: FranjaEntrada[],
  duracionTurnoMin: number,
): ResultadoValidacionFranjas {
  const errores: ErroresFranjas = {};
  const validas: { indice: number; franja: FranjaSemanal }[] = [];

  entradas.forEach((entrada, indice) => {
    if (!esDiaSemana(entrada.diaSemana)) {
      errores[indice] = MSG_DIA_INVALIDO;
      return;
    }
    const inicio = validarHora(entrada.inicio);
    if ("error" in inicio) {
      errores[indice] = inicio.error;
      return;
    }
    const fin = validarHora(entrada.fin);
    if ("error" in fin) {
      errores[indice] = fin.error;
      return;
    }
    if (fin.minutos <= inicio.minutos) {
      errores[indice] = MSG_FIN_ANTES_DE_INICIO;
      return;
    }
    if (fin.minutos - inicio.minutos < duracionTurnoMin) {
      errores[indice] = mensajeFranjaSinTurnos(duracionTurnoMin);
      return;
    }
    validas.push({
      indice,
      franja: {
        diaSemana: entrada.diaSemana,
        inicioMin: inicio.minutos,
        finMin: fin.minutos,
      },
    });
  });

  validas.forEach((actual, posicion) => {
    const previa = validas
      .slice(0, posicion)
      .find((otra) => seSuperponen(otra.franja, actual.franja));
    if (previa) {
      const { diaSemana, inicioMin, finMin } = previa.franja;
      errores[actual.indice] =
        `${MSG_FRANJA_SUPERPUESTA} (conflicto con ${etiquetaDia(diaSemana)} ` +
        `${formatearHora(inicioMin)} - ${formatearHora(finMin)})`;
    }
  });

  if (Object.keys(errores).length > 0) {
    return { ok: false, errores };
  }
  return { ok: true, franjas: ordenarFranjas(validas.map((v) => v.franja)) };
}

function ordenarFranjas(franjas: FranjaSemanal[]): FranjaSemanal[] {
  return franjas
    .slice()
    .sort((a, b) => a.diaSemana - b.diaSemana || a.inicioMin - b.inicioMin);
}

// ---------------------------------------------------------------------------
// Fechas y meses
// ---------------------------------------------------------------------------

function aFechaISO(anio: number, mes: number, dia: number): FechaISO {
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

/** Fecha de hoy en la zona horaria de la clínica (el servidor corre en UTC). */
export function hoyEnArgentina(ahora: Date): FechaISO {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_HORARIA_CLINICA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(ahora);
  const valor = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

export function diaSemanaDe(fecha: FechaISO): DiaSemana {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const domingoCero = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return (((domingoCero + 6) % 7) + 1) as DiaSemana;
}

/** `"2026-11"` → `{ anio: 2026, mes: 11 }`. `null` si no es válido. */
export function parsearMes(valor: string): MesAgenda | null {
  const coincidencia = /^(\d{4})-(\d{2})$/.exec(valor.trim());
  if (!coincidencia) {
    return null;
  }
  const mes = Number(coincidencia[2]);
  return mes >= 1 && mes <= 12 ? { anio: Number(coincidencia[1]), mes } : null;
}

export function formatearMes({ anio, mes }: MesAgenda): string {
  return `${anio}-${String(mes).padStart(2, "0")}`;
}

/** `{ anio: 2026, mes: 11 }` → `"Noviembre 2026"`. */
export function etiquetaMes({ anio, mes }: MesAgenda): string {
  return `${NOMBRES_MES[mes - 1]} ${anio}`;
}

export function mesDeFecha(fecha: FechaISO): MesAgenda {
  const [anio, mes] = fecha.split("-").map(Number);
  return { anio, mes };
}

export function sumarMeses({ anio, mes }: MesAgenda, cantidad: number): MesAgenda {
  const indice = anio * 12 + (mes - 1) + cantidad;
  return { anio: Math.floor(indice / 12), mes: (indice % 12) + 1 };
}

/** Meses en los que se puede cargar disponibilidad: el actual y los 5 siguientes. */
export function mesesHabilitados(hoy: FechaISO): MesAgenda[] {
  const actual = mesDeFecha(hoy);
  return Array.from({ length: MESES_HACIA_ADELANTE + 1 }, (_, i) =>
    sumarMeses(actual, i),
  );
}

export function esMesHabilitado(mes: MesAgenda, hoy: FechaISO): boolean {
  return mesesHabilitados(hoy).some(
    (m) => m.anio === mes.anio && m.mes === mes.mes,
  );
}

export function primerDiaDelMes({ anio, mes }: MesAgenda): FechaISO {
  return aFechaISO(anio, mes, 1);
}

export function ultimoDiaDelMes({ anio, mes }: MesAgenda): FechaISO {
  // El día 0 del mes siguiente es el último día de este mes.
  const dias = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  return aFechaISO(anio, mes, dias);
}

export function diasDelMes(mes: MesAgenda): FechaISO[] {
  const cantidad = Number(ultimoDiaDelMes(mes).slice(8));
  return Array.from({ length: cantidad }, (_, i) =>
    aFechaISO(mes.anio, mes.mes, i + 1),
  );
}

// ---------------------------------------------------------------------------
// Patrón semanal ↔ franjas con fecha
// ---------------------------------------------------------------------------

/**
 * Expande el patrón semanal a las fechas del mes desde `desde` (inclusive).
 * Con `desde` = hoy, las fechas pasadas quedan afuera y hoy sí se incluye.
 */
export function expandirMes(
  mes: MesAgenda,
  patron: FranjaSemanal[],
  desde: FechaISO,
): FranjaConFecha[] {
  return diasDelMes(mes)
    .filter((fecha) => fecha >= desde)
    .flatMap((fecha) => {
      const dia = diaSemanaDe(fecha);
      return ordenarFranjas(patron.filter((f) => f.diaSemana === dia)).map(
        (f) => ({ fecha, inicioMin: f.inicioMin, finMin: f.finMin }),
      );
    });
}

/**
 * Reconstruye el patrón semanal a partir de franjas con fecha. Por cada día de
 * la semana toma las franjas de la ÚLTIMA fecha de ese día, así un cambio a
 * mitad de mes no mezcla el patrón viejo con el nuevo.
 */
export function patronDesdeFranjas(franjas: FranjaConFecha[]): FranjaSemanal[] {
  const ultimaFechaPorDia = new Map<DiaSemana, FechaISO>();
  for (const { fecha } of franjas) {
    const dia = diaSemanaDe(fecha);
    const ultima = ultimaFechaPorDia.get(dia);
    if (!ultima || fecha > ultima) {
      ultimaFechaPorDia.set(dia, fecha);
    }
  }
  return ordenarFranjas(
    franjas
      .filter((f) => ultimaFechaPorDia.get(diaSemanaDe(f.fecha)) === f.fecha)
      .map((f) => ({
        diaSemana: diaSemanaDe(f.fecha),
        inicioMin: f.inicioMin,
        finMin: f.finMin,
      })),
  );
}

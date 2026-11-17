import type { FechaISO } from "./agenda";
import type { EstadoTurno } from "./turno";

export const ESPECIALIDADES_REPORTE = [
  "CLINICA_MEDICA",
  "PEDIATRIA",
  "TRAUMATOLOGIA",
] as const;

export type EspecialidadReporte = (typeof ESPECIALIDADES_REPORTE)[number];

export const ETIQUETAS_ESPECIALIDAD: Record<EspecialidadReporte, string> = {
  CLINICA_MEDICA: "Clínica médica",
  PEDIATRIA: "Pediatría",
  TRAUMATOLOGIA: "Traumatología",
};

export const MSG_RANGO_INVALIDO =
  "El rango de fechas no es válido: 'desde' no puede ser posterior a 'hasta'";
export const MSG_RANGO_INCOMPLETO = "Debe indicar una fecha 'desde' y una 'hasta'";
export const MSG_FECHA_INVALIDA = "Ingresá fechas válidas en el rango";

export interface ConteoReporteTurnos {
  reservados: number;
  atendidos: number;
  ausentes: number;
  cancelados: number;
  total: number;
}

export interface FilaReporteTurnos extends ConteoReporteTurnos {
  especialidad: EspecialidadReporte;
  etiqueta: string;
}

export interface GrupoTurnoReporte {
  especialidad: EspecialidadReporte | null;
  estado: EstadoTurno;
  cantidad: number;
}

export type ResultadoRangoReporte =
  | { valido: true; desde: FechaISO; hasta: FechaISO }
  | { valido: false; error: string };

function esFechaISOValida(valor: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }
  const fecha = new Date(`${valor}T00:00:00.000Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

export function validarRangoReporte(
  desde: string | undefined,
  hasta: string | undefined,
): ResultadoRangoReporte {
  if (!desde || !hasta) {
    return { valido: false, error: MSG_RANGO_INCOMPLETO };
  }
  if (!esFechaISOValida(desde) || !esFechaISOValida(hasta)) {
    return { valido: false, error: MSG_FECHA_INVALIDA };
  }
  if (desde > hasta) {
    return { valido: false, error: MSG_RANGO_INVALIDO };
  }
  return { valido: true, desde, hasta };
}

export function consolidarTurnosPorEspecialidad(
  grupos: readonly GrupoTurnoReporte[],
): FilaReporteTurnos[] {
  const filas = ESPECIALIDADES_REPORTE.map((especialidad) => ({
    especialidad,
    etiqueta: ETIQUETAS_ESPECIALIDAD[especialidad],
    reservados: 0,
    atendidos: 0,
    ausentes: 0,
    cancelados: 0,
    total: 0,
  }));
  const porEspecialidad = new Map(filas.map((fila) => [fila.especialidad, fila]));

  for (const grupo of grupos) {
    const fila = grupo.especialidad ? porEspecialidad.get(grupo.especialidad) : undefined;
    if (!fila || grupo.cantidad <= 0) {
      continue;
    }
    switch (grupo.estado) {
      case "RESERVADO":
        fila.reservados += grupo.cantidad;
        break;
      case "ATENDIDO":
        fila.atendidos += grupo.cantidad;
        break;
      case "AUSENTE":
        fila.ausentes += grupo.cantidad;
        break;
      case "CANCELADO":
        fila.cancelados += grupo.cantidad;
        break;
      default:
        continue;
    }
    fila.total += grupo.cantidad;
  }

  return filas;
}

export function totalizarReporte(filas: readonly FilaReporteTurnos[]): ConteoReporteTurnos {
  return filas.reduce<ConteoReporteTurnos>(
    (total, fila) => ({
      reservados: total.reservados + fila.reservados,
      atendidos: total.atendidos + fila.atendidos,
      ausentes: total.ausentes + fila.ausentes,
      cancelados: total.cancelados + fila.cancelados,
      total: total.total + fila.total,
    }),
    { reservados: 0, atendidos: 0, ausentes: 0, cancelados: 0, total: 0 },
  );
}

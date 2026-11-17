import type { FechaISO } from "./agenda";
import type { EstadoTurno } from "./turno";

export const ETIQUETA_SIN_DATOS = "Sin datos";

interface PersonaReporteAsistencia {
  firstName: string | null;
  lastName: string | null;
}

export interface MedicoReporteAsistencia extends PersonaReporteAsistencia {
  id: string;
}

export interface GrupoAsistencia {
  medicoId: string;
  estado: EstadoTurno;
  cantidad: number;
}

export interface FilaReporteAsistencia {
  medicoId: string;
  medico: string;
  atendidos: number;
  ausentes: number;
  porcentaje: number | null;
}

export interface ReporteAsistencia {
  desde: FechaISO;
  hasta: FechaISO;
  filas: FilaReporteAsistencia[];
  totalProfesionales: number;
}

function nombreCompleto(persona: PersonaReporteAsistencia): string {
  return `${persona.firstName ?? ""} ${persona.lastName ?? ""}`.trim();
}

function compararMedicos(
  a: MedicoReporteAsistencia,
  b: MedicoReporteAsistencia,
): number {
  return (
    (a.lastName ?? "").localeCompare(b.lastName ?? "", "es", {
      sensitivity: "base",
    }) ||
    (a.firstName ?? "").localeCompare(b.firstName ?? "", "es", {
      sensitivity: "base",
    })
  );
}

export function porcentajeAsistencia(
  atendidos: number,
  ausentes: number,
): number | null {
  const total = atendidos + ausentes;
  if (total <= 0) {
    return null;
  }
  return Math.round((atendidos / total) * 100);
}

export function formatearPorcentajeAsistencia(
  porcentaje: number | null,
): string {
  return porcentaje === null ? ETIQUETA_SIN_DATOS : `${porcentaje}%`;
}

export function consolidarAsistenciaPorMedico(
  medicos: readonly MedicoReporteAsistencia[],
  grupos: readonly GrupoAsistencia[],
): FilaReporteAsistencia[] {
  const ordenados = [...medicos].sort(compararMedicos);
  const conteos = new Map<string, { atendidos: number; ausentes: number }>();

  for (const medico of ordenados) {
    conteos.set(medico.id, { atendidos: 0, ausentes: 0 });
  }

  for (const grupo of grupos) {
    const conteo = conteos.get(grupo.medicoId);
    if (!conteo) {
      continue;
    }
    if (grupo.estado === "ATENDIDO") {
      conteo.atendidos += grupo.cantidad;
    } else if (grupo.estado === "AUSENTE") {
      conteo.ausentes += grupo.cantidad;
    }
  }

  return ordenados.map((medico) => {
    const conteo = conteos.get(medico.id) ?? { atendidos: 0, ausentes: 0 };
    return {
      medicoId: medico.id,
      medico: nombreCompleto(medico),
      atendidos: conteo.atendidos,
      ausentes: conteo.ausentes,
      porcentaje: porcentajeAsistencia(conteo.atendidos, conteo.ausentes),
    };
  });
}

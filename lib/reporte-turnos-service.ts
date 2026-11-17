import type { FechaISO } from "@/lib/domain/agenda";
import {
  ESPECIALIDADES_REPORTE,
  consolidarTurnosPorEspecialidad,
  totalizarReporte,
  type ConteoReporteTurnos,
  type EspecialidadReporte,
  type FilaReporteTurnos,
  type GrupoTurnoReporte,
} from "@/lib/domain/reporte-turnos";
import type { EstadoTurno } from "@/lib/domain/turno";
import { aFechaDb } from "@/lib/fecha-db";
import { getPrisma } from "@/lib/prisma";

export interface ReporteTurnosPorEspecialidad {
  desde: FechaISO;
  hasta: FechaISO;
  filas: FilaReporteTurnos[];
  total: ConteoReporteTurnos;
}

export async function generarReporteTurnosPorEspecialidad(
  desde: FechaISO,
  hasta: FechaISO,
): Promise<ReporteTurnosPorEspecialidad> {
  const gruposDb = await getPrisma().turno.groupBy({
    by: ["especialidad", "estado"],
    where: {
      fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) },
      especialidad: { in: [...ESPECIALIDADES_REPORTE] },
    },
    _count: true as const,
  });

  const grupos: GrupoTurnoReporte[] = gruposDb.map((grupo) => ({
    especialidad: grupo.especialidad as EspecialidadReporte | null,
    estado: grupo.estado as EstadoTurno,
    cantidad: grupo._count,
  }));

  const filas = consolidarTurnosPorEspecialidad(grupos);
  return { desde, hasta, filas, total: totalizarReporte(filas) };
}

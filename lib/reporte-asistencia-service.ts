import type { FechaISO } from "@/lib/domain/agenda";
import {
  consolidarAsistenciaPorMedico,
  type GrupoAsistencia,
  type MedicoReporteAsistencia,
  type ReporteAsistencia,
} from "@/lib/domain/reporte-asistencia";
import type { EstadoTurno } from "@/lib/domain/turno";
import { aFechaDb } from "@/lib/fecha-db";
import { getPrisma } from "@/lib/prisma";

export async function generarReporteAsistencia(
  desde: FechaISO,
  hasta: FechaISO,
): Promise<ReporteAsistencia> {
  const prisma = getPrisma();
  const [medicosDb, gruposDb] = await Promise.all([
    prisma.user.findMany({
      where: { role: "MEDICO" },
      select: { id: true, firstName: true, lastName: true },
    }),
    prisma.turno.groupBy({
      by: ["medicoId", "estado"],
      where: {
        fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) },
        estado: { in: ["ATENDIDO", "AUSENTE"] },
        medicoId: { not: null },
      },
      _count: true as const,
    }),
  ]);

  const medicos: MedicoReporteAsistencia[] = medicosDb.map((medico) => ({
    id: medico.id,
    firstName: medico.firstName,
    lastName: medico.lastName,
  }));
  const grupos: GrupoAsistencia[] = gruposDb.flatMap((grupo) =>
    grupo.medicoId
      ? [
          {
            medicoId: grupo.medicoId,
            estado: grupo.estado as EstadoTurno,
            cantidad: grupo._count,
          },
        ]
      : [],
  );

  const filas = consolidarAsistenciaPorMedico(medicos, grupos);
  return { desde, hasta, filas, totalProfesionales: filas.length };
}

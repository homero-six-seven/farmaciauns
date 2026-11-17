import type { FechaISO } from "@/lib/domain/agenda";
import {
  consolidarReporteStock,
  limitesMovimientosEnArgentina,
  totalizarReporteStock,
  type FilaReporteStock,
  type GrupoMovimientoStock,
  type GrupoTurnoStock,
  type TotalesReporteStock,
} from "@/lib/domain/reporte-stock";
import type { TipoMovimiento } from "@/lib/domain/vacuna";
import { aFechaDb } from "@/lib/fecha-db";
import { getPrisma } from "@/lib/prisma";

export interface ReporteStockVacunas {
  desde: FechaISO;
  hasta: FechaISO;
  filas: FilaReporteStock[];
  total: TotalesReporteStock;
}

export async function generarReporteStockVacunas(
  desde: FechaISO,
  hasta: FechaISO,
): Promise<ReporteStockVacunas> {
  const prisma = getPrisma();
  const limites = limitesMovimientosEnArgentina(desde, hasta);

  const [vacunas, movimientosDb, turnosDb] = await Promise.all([
    prisma.vacuna.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, stockActual: true },
    }),
    prisma.movimientoStock.groupBy({
      by: ["vacunaId", "tipo"],
      where: { createdAt: { gte: limites.desde, lt: limites.hasta } },
      _sum: { cantidad: true },
    }),
    prisma.turno.groupBy({
      by: ["vacunaId"],
      where: {
        tipo: "VACUNACION",
        vacunaId: { not: null },
        fecha: { gte: aFechaDb(desde), lte: aFechaDb(hasta) },
      },
      _count: true as const,
    }),
  ]);

  const movimientos: GrupoMovimientoStock[] = movimientosDb.map((grupo) => ({
    vacunaId: grupo.vacunaId,
    tipo: grupo.tipo as TipoMovimiento,
    cantidad: grupo._sum.cantidad ?? 0,
  }));
  const turnos: GrupoTurnoStock[] = turnosDb.map((grupo) => ({
    vacunaId: grupo.vacunaId,
    cantidad: grupo._count,
  }));

  const filas = consolidarReporteStock(vacunas, movimientos, turnos);
  return { desde, hasta, filas, total: totalizarReporteStock(filas) };
}

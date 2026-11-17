import type { FechaISO } from "@/lib/domain/agenda";
import {
  consolidarPagos,
  totalizarPagos,
  type ReportePagos,
} from "@/lib/domain/reporte-pagos";
import { limitesMovimientosEnArgentina } from "@/lib/domain/reporte-stock";
import { getPrisma } from "@/lib/prisma";

export async function generarReportePagos(
  desde: FechaISO,
  hasta: FechaISO,
): Promise<ReportePagos> {
  const limites = limitesMovimientosEnArgentina(desde, hasta);
  const datos = await getPrisma().pago.findMany({
    where: { createdAt: { gte: limites.desde, lt: limites.hasta } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      createdAt: true,
      importe: true,
      medioPago: true,
      paciente: { select: { firstName: true, lastName: true } },
      turno: {
        select: {
          medico: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  const pagos = consolidarPagos(
    datos.map((pago) => ({
      id: pago.id,
      createdAt: pago.createdAt,
      importe: pago.importe,
      medioPago: pago.medioPago,
      paciente: pago.paciente,
      medico: pago.turno.medico,
    })),
  );

  return {
    desde,
    hasta,
    pagos,
    totales: totalizarPagos(pagos),
    sinPagos: pagos.length === 0,
  };
}

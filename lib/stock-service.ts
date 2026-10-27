/**
 * Servicio de Stock de Vacunas (RF-04a).
 *
 * `Vacuna.stockActual` es la fuente de verdad de "unidades disponibles" y
 * `MovimientoStock` es el ledger inmutable de auditoría. Cada mutación
 * actualiza ambos ATOMICAMENTE en una transacción.
 */

import { getPrisma } from "./prisma";
import { ApiError } from "./api";
import {
  MSG_CANTIDAD_INVALIDA,
  MSG_DETALLE_OBLIGATORIO,
  MSG_MOTIVO_INVALIDO,
  MSG_MOTIVO_OBLIGATORIO,
  MSG_VACUNA_NO_ENCONTRADA,
  MAX_STOCK_VACUNA,
  esMotivoEgreso,
  msgStockMaximo,
  msgStockInsuficiente,
  normalizarDetalleMotivo,
  validarCantidad,
  type MotivoEgreso,
} from "./domain/vacuna";

export type VacunaConStock = {
  id: string;
  nombre: string;
  stockActual: number;
};

/** Listado de vacunas con sus unidades disponibles (US-24). */
export async function listarVacunas(): Promise<VacunaConStock[]> {
  const prisma = getPrisma();
  return prisma.vacuna.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true, stockActual: true },
  });
}

/** Registra un ingreso de stock (US-22), sin superar 50 unidades por vacuna. */
export async function registrarIngreso(
  vacunaId: string,
  cantidad: number,
  realizadoPor: string,
) {
  if (!validarCantidad(cantidad)) {
    throw new ApiError(422, MSG_CANTIDAD_INVALIDA);
  }

  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const resultado = await tx.vacuna.updateMany({
      where: {
        id: vacunaId,
        stockActual: { lte: MAX_STOCK_VACUNA - cantidad },
      },
      data: { stockActual: { increment: cantidad } },
    });

    if (resultado.count === 0) {
      const vacuna = await tx.vacuna.findUnique({
        where: { id: vacunaId },
        select: { id: true, stockActual: true },
      });
      if (!vacuna) {
        throw new ApiError(404, MSG_VACUNA_NO_ENCONTRADA);
      }
      throw new ApiError(
        409,
        msgStockMaximo(Math.max(0, MAX_STOCK_VACUNA - vacuna.stockActual)),
      );
    }

    const actualizada = await tx.vacuna.findUniqueOrThrow({
      where: { id: vacunaId },
      select: { id: true, nombre: true, stockActual: true },
    });

    const movimiento = await tx.movimientoStock.create({
      data: { vacunaId, tipo: "INGRESO", cantidad, realizadoPor },
      select: { id: true },
    });

    return { movimientoId: movimiento.id, ...actualizada };
  });
}

/**
 * Registra un egreso/ajuste de stock (US-23) con motivo obligatorio.
 *
 * Regla de oro (stock nunca negativo): se hace un decremento atómico
 * condicional (`updateMany` con `stockActual >= cantidad`) dentro de la
 * transacción. Si no afecta filas, o no existe la vacuna o no alcanza el
 * stock, y NO se registra ningún movimiento.
 */
export async function registrarEgreso(
  vacunaId: string,
  cantidad: number,
  motivo: string,
  motivoDetalle: string | null | undefined,
  realizadoPor: string,
) {
  if (!validarCantidad(cantidad)) {
    throw new ApiError(422, MSG_CANTIDAD_INVALIDA);
  }
  if (!motivo) {
    throw new ApiError(422, MSG_MOTIVO_OBLIGATORIO);
  }
  if (!esMotivoEgreso(motivo)) {
    throw new ApiError(422, MSG_MOTIVO_INVALIDO);
  }
  const detalle = normalizarDetalleMotivo(motivoDetalle);
  if (motivo === "OTRO" && !detalle) {
    throw new ApiError(422, MSG_DETALLE_OBLIGATORIO);
  }

  const prisma = getPrisma();
  return prisma.$transaction(async (tx) => {
    const result = await tx.vacuna.updateMany({
      where: { id: vacunaId, stockActual: { gte: cantidad } },
      data: { stockActual: { decrement: cantidad } },
    });

    if (result.count === 0) {
      const vacuna = await tx.vacuna.findUnique({
        where: { id: vacunaId },
        select: { id: true, stockActual: true },
      });
      if (!vacuna) {
        throw new ApiError(404, MSG_VACUNA_NO_ENCONTRADA);
      }
      throw new ApiError(409, msgStockInsuficiente(vacuna.stockActual));
    }

    const actualizada = await tx.vacuna.findUniqueOrThrow({
      where: { id: vacunaId },
      select: { id: true, nombre: true, stockActual: true },
    });

    const movimiento = await tx.movimientoStock.create({
      data: {
        vacunaId,
        tipo: "EGRESO",
        cantidad,
        motivo: motivo as MotivoEgreso,
        motivoDetalle: detalle,
        realizadoPor,
      },
      select: { id: true },
    });

    return { movimientoId: movimiento.id, ...actualizada };
  });
}

/** Historial de movimientos (auditoría), opcionalmente filtrado por vacuna. */
export async function listarMovimientos(vacunaId?: string) {
  const prisma = getPrisma();
  return prisma.movimientoStock.findMany({
    where: vacunaId ? { vacunaId } : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      vacunaId: true,
      tipo: true,
      cantidad: true,
      motivo: true,
      motivoDetalle: true,
      realizadoPor: true,
      createdAt: true,
      vacuna: { select: { nombre: true } },
    },
  });
}

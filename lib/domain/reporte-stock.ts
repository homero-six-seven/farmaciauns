import type { FechaISO } from "./agenda";
import { DESPLAZAMIENTO_ARGENTINA_MIN } from "./turno";
import type { TipoMovimiento } from "./vacuna";

export const LIMITE_STOCK_BAJO = 10;
export const ETIQUETA_STOCK_BAJO = "STOCK BAJO";

export interface VacunaReporteStock {
  id: string;
  nombre: string;
  stockActual: number;
}

export interface GrupoMovimientoStock {
  vacunaId: string;
  tipo: TipoMovimiento;
  cantidad: number;
}

export interface GrupoTurnoStock {
  vacunaId: string | null;
  cantidad: number;
}

export interface FilaReporteStock {
  vacunaId: string;
  nombre: string;
  stockActual: number;
  ingresos: number;
  egresos: number;
  turnos: number;
  stockBajo: boolean;
}

export interface TotalesReporteStock {
  biologicos: number;
  alertas: number;
}

export function esStockBajo(stockActual: number): boolean {
  return stockActual <= LIMITE_STOCK_BAJO;
}

export function limitesMovimientosEnArgentina(
  desde: FechaISO,
  hasta: FechaISO,
): { desde: Date; hasta: Date } {
  const inicio = new Date(`${desde}T00:00:00.000Z`);
  const finExclusivo = new Date(`${hasta}T00:00:00.000Z`);
  finExclusivo.setUTCDate(finExclusivo.getUTCDate() + 1);
  const desplazamiento = DESPLAZAMIENTO_ARGENTINA_MIN * 60_000;
  return {
    desde: new Date(inicio.getTime() - desplazamiento),
    hasta: new Date(finExclusivo.getTime() - desplazamiento),
  };
}

export function consolidarReporteStock(
  vacunas: readonly VacunaReporteStock[],
  movimientos: readonly GrupoMovimientoStock[],
  turnos: readonly GrupoTurnoStock[],
): FilaReporteStock[] {
  const filas: FilaReporteStock[] = vacunas.map((vacuna) => ({
    vacunaId: vacuna.id,
    nombre: vacuna.nombre,
    stockActual: vacuna.stockActual,
    ingresos: 0,
    egresos: 0,
    turnos: 0,
    stockBajo: false,
  }));
  const porId = new Map(filas.map((fila) => [fila.vacunaId, fila]));

  for (const movimiento of movimientos) {
    const fila = porId.get(movimiento.vacunaId);
    if (!fila || movimiento.cantidad <= 0) {
      continue;
    }
    if (movimiento.tipo === "INGRESO") {
      fila.ingresos += movimiento.cantidad;
    } else if (movimiento.tipo === "EGRESO") {
      fila.egresos += movimiento.cantidad;
    }
  }

  for (const turno of turnos) {
    if (!turno.vacunaId || turno.cantidad <= 0) {
      continue;
    }
    const fila = porId.get(turno.vacunaId);
    if (fila) {
      fila.turnos += turno.cantidad;
    }
  }

  for (const fila of filas) {
    fila.stockBajo = esStockBajo(fila.stockActual);
  }
  return filas;
}

export function totalizarReporteStock(
  filas: readonly FilaReporteStock[],
): TotalesReporteStock {
  return {
    biologicos: filas.length,
    alertas: filas.filter((fila) => fila.stockBajo).length,
  };
}

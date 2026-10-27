/**
 * Dominio de "Stock de Vacunas" — tipos y validaciones PURAS.
 *
 * Acá NO hay I/O. Todo es determinista y testable de forma aislada.
 * El modelo canónico es `prisma/schema.prisma` (model `Vacuna` +
 * `MovimientoStock` + enums `TipoMovimiento`/`MotivoEgreso`).
 */

export type TipoMovimiento = "INGRESO" | "EGRESO";

export type MotivoEgreso =
  | "VENCIMIENTO"
  | "ROTURA_PERDIDA"
  | "CORRECCION_CARGA"
  | "OTRO";

/** Motivos de egreso válidos (lista fija, RF-04a / US-23). */
export const MOTIVOS_EGRESO: MotivoEgreso[] = [
  "VENCIMIENTO",
  "ROTURA_PERDIDA",
  "CORRECCION_CARGA",
  "OTRO",
];

/** Etiqueta legible de cada motivo para las pantallas. */
export const ETIQUETA_MOTIVO: Record<MotivoEgreso, string> = {
  VENCIMIENTO: "Vencimiento",
  ROTURA_PERDIDA: "Rotura o pérdida",
  CORRECCION_CARGA: "Corrección de carga",
  OTRO: "Otro",
};

export function esMotivoEgreso(motivo: string): motivo is MotivoEgreso {
  return (MOTIVOS_EGRESO as string[]).includes(motivo);
}

// ---------------------------------------------------------------------------
// Mensajes de error exactos
// ---------------------------------------------------------------------------

export const MSG_CANTIDAD_INVALIDA = "Ingresá una cantidad mayor a 0";
export const MSG_MOTIVO_OBLIGATORIO = "El motivo es obligatorio";
export const MSG_MOTIVO_INVALIDO = "Motivo inválido";
export const MSG_DETALLE_OBLIGATORIO =
  "El detalle es obligatorio cuando el motivo es Otro";
export const MSG_STOCK_INSUFICIENTE = "No hay suficientes unidades";
export const MSG_STOCK_MAXIMO = "El stock máximo por vacuna";
export const MSG_VACUNA_NO_ENCONTRADA = "Vacuna no encontrada";
export const MAX_STOCK_VACUNA = 50;

/** Mensaje de stock insuficiente con las unidades disponibles (wireframe US-22/23). */
export function msgStockInsuficiente(disponible: number): string {
  return `${MSG_STOCK_INSUFICIENTE} (disponibles: ${disponible})`;
}

/** Mensaje cuando un ingreso supera el máximo físico permitido (US-22). */
export function msgStockMaximo(disponibles: number): string {
  return `${MSG_STOCK_MAXIMO} es de ${MAX_STOCK_VACUNA} unidades (disponibles para ingresar: ${disponibles})`;
}

// ---------------------------------------------------------------------------
// Validaciones atómicas (puras)
// ---------------------------------------------------------------------------

/** True si `cantidad` es un entero mayor a 0 (US-22 / US-23). */
export function validarCantidad(cantidad: number): boolean {
  return Number.isInteger(cantidad) && cantidad > 0;
}

/** Indica si el ingreso mantiene el stock dentro del máximo permitido. */
export function puedeRegistrarIngreso(
  stockActual: number,
  cantidad: number,
): boolean {
  return stockActual + cantidad <= MAX_STOCK_VACUNA;
}

/** Normaliza el detalle de motivo (trim); `null` si está vacío. */
export function normalizarDetalleMotivo(
  detalle: string | null | undefined,
): string | null {
  const d = detalle?.trim();
  return d ? d : null;
}

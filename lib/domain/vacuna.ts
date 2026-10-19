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

export const MSG_CANTIDAD_INVALIDA = "La cantidad debe ser un entero mayor a 0";
export const MSG_MOTIVO_OBLIGATORIO = "El motivo es obligatorio";
export const MSG_MOTIVO_INVALIDO = "Motivo inválido";
export const MSG_DETALLE_OBLIGATORIO =
  "El detalle es obligatorio cuando el motivo es Otro";
export const MSG_STOCK_INSUFICIENTE = "Stock insuficiente";
export const MSG_VACUNA_NO_ENCONTRADA = "Vacuna no encontrada";

// ---------------------------------------------------------------------------
// Validaciones atómicas (puras)
// ---------------------------------------------------------------------------

/** True si `cantidad` es un entero mayor a 0 (US-22 / US-23). */
export function validarCantidad(cantidad: number): boolean {
  return Number.isInteger(cantidad) && cantidad > 0;
}

/** Normaliza el detalle de motivo (trim); `null` si está vacío. */
export function normalizarDetalleMotivo(
  detalle: string | null | undefined,
): string | null {
  const d = detalle?.trim();
  return d ? d : null;
}

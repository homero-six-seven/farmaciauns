/**
 * Dominio de "Cobertura" — tipos y validaciones PURAS.
 *
 * Acá NO hay I/O: ni Next.js, ni Prisma, ni `process.env`. Todo lo que exporta
 * este módulo es determinista y testable de forma aislada.
 *
 * El modelo canónico de persistencia es `prisma/schema.prisma` (model
 * `Cobertura` + `MedicoCobertura` + columnas `coberturaId`/`numeroAfiliado`
 * de `User`).
 */

/**
 * Normaliza el nombre de una cobertura para comparación case-insensitive.
 * Además de trim + lowercase, elimina puntos y espacios: "O.S.D.E", "O. S.
 * D. E" y "OSDE" normalizan igual para no duplicar siglas (defecto 07).
 */
export function normalizarNombreCobertura(nombre: string): string {
  return nombre.trim().toLowerCase().replace(/[\s.]+/g, "");
}

export function esNombreCoberturaVacio(
  nombre: string | null | undefined,
): boolean {
  return nombre == null || nombre.trim() === "";
}

/** Vista pública/serializable de una cobertura. */
export type CoberturaResumen = {
  id: string;
  nombre: string;
};

// ---------------------------------------------------------------------------
// Mensajes de error exactos
// ---------------------------------------------------------------------------

export const MSG_COBERTURA_OBLIGATORIA = "El nombre de la cobertura es obligatorio";
export const MSG_COBERTURA_YA_ACEPTADA = "Ya aceptás esta cobertura";
export const MSG_COBERTURA_NO_DISPONIBLE =
  "La cobertura no está disponible para nuevos pacientes";
export const MSG_AFILIADO_OBLIGATORIO = "El número de afiliado es obligatorio";
export const MSG_COBERTURA_NO_ENCONTRADA = "Cobertura no encontrada";

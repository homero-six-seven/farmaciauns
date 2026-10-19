/**
 * Helpers de autorización y errores para los route handlers REST.
 *
 * A diferencia de `requireRole` (que hace `redirect()` para páginas), acá se
 * devuelven respuestas JSON con códigos 401/403, porque un cliente de API no
 * sigue redirects.
 */

import { NextResponse } from "next/server";
import { getCurrentDbUser } from "./auth";
import { normalizeRole, type Role } from "./authorization";

/** Error tipado que un route handler convierte en respuesta JSON. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Autoriza la petición para los roles permitidos y devuelve el id de la fila
 * `User` (necesario para FK como `realizadoPor`/`medicoId`) y el rol.
 *
 * - Sin sesión o usuario inactivo → `ApiError(401)`.
 * - Rol no permitido → `ApiError(403)`.
 */
export async function requireApiRole(
  allowed: readonly Role[],
): Promise<{ dbUserId: string; role: Role }> {
  const dbUser = await getCurrentDbUser();

  if (!dbUser || !dbUser.isActive) {
    throw new ApiError(401, "No autenticado");
  }

  const role = normalizeRole(String(dbUser.role));

  if (!role || !allowed.includes(role)) {
    throw new ApiError(403, "No tiene permisos para esta acción");
  }

  return { dbUserId: dbUser.id, role };
}

/** Envuelve una respuesta JSON de error con el código indicado. */
export function errorResponse(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** Convierte una excepción en `NextResponse` (ApiError → su status; resto → 500). */
export function toErrorResponse(err: unknown) {
  if (err instanceof ApiError) {
    return errorResponse(err.status, err.message);
  }
  console.error("Error inesperado en route handler:", err);
  return errorResponse(500, "Error interno");
}

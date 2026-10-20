import { redirect } from "next/navigation";
import { getCurrentDbUser } from "./auth";

export const roles = ["admin", "enfermera", "medico", "paciente"] as const;

export type Role = (typeof roles)[number];

const roleAliases: Record<string, Role> = {
  admin: "admin",
  administrador: "admin",
  administrativo: "admin",
  enfermera: "enfermera",
  medico: "medico",
  paciente: "paciente",
};

export function normalizeRole(value: string | null | undefined): Role | null {
  return value ? roleAliases[value.toLowerCase()] ?? null : null;
}

/**
 * Autoriza la página para los roles permitidos. Usa `getCurrentDbUser` (que
 * resuelve por clerkId con fallback por email y sincroniza Clerk → DB), así un
 * usuario de Clerk sin fila `User` previa no queda bloqueado por error.
 */
export async function requireRole(allowedRoles: readonly Role[]) {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/sign-in");
  }

  if (!user.isActive) {
    redirect("/sign-in/error?reason=inactive-account");
  }

  const role = normalizeRole(String(user.role));

  if (!role || !allowedRoles.includes(role)) {
    redirect("/prototipos/pantalla_6_acceso_denegado");
  }

  return role;
}

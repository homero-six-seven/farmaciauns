import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

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

export async function requireRole(allowedRoles: readonly Role[]) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // El rol vive en Clerk `publicMetadata` (ver endpoint de invitaciones).
  // Se lee directo del backend de Clerk para no depender de la tabla User.
  const user = await (await clerkClient()).users.getUser(userId);
  const publicMetadata = user.publicMetadata as Record<string, unknown> | undefined;
  const rawRole = publicMetadata?.role;
  const role = normalizeRole(typeof rawRole === "string" ? rawRole : null);

  if (!role || !allowedRoles.includes(role)) {
    redirect("/prototipos/pantalla_6_acceso_denegado");
  }

  return role;
}

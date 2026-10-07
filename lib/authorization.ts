import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPrisma } from "@/lib/prisma";

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

  const user = await getPrisma().user.findUnique({
    where: { clerkId: userId },
    select: { role: true, isActive: true },
  });

  if (user && !user.isActive) {
    redirect("/sign-in/error?reason=inactive-account");
  }

  const role = normalizeRole(String(user?.role));

  if (!role || !allowedRoles.includes(role)) {
    redirect("/prototipos/pantalla_6_acceso_denegado");
  }

  return role;
}

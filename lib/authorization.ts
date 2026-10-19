import { auth, currentUser } from "@clerk/nextjs/server";
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

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const prisma = getPrisma();
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: userId },
        ...(email ? [{ email }] : []),
      ],
    },
    select: { role: true, isActive: true },
  });

  if (user && !user.isActive) {
    redirect("/sign-in/error?reason=inactive-account");
  }

  const clerkRole = normalizeRole(
    clerkUser?.publicMetadata?.role as string | undefined,
  );
  const role = normalizeRole(String(user?.role)) ?? clerkRole;

  if (!role || !allowedRoles.includes(role)) {
    redirect("/prototipos/pantalla_6_acceso_denegado");
  }

  return role;
}

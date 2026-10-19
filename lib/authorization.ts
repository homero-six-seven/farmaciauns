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

/**
 * RF-01 — Médico logueado, como fila de `User` en Neon.
 *
 * Reusa `requireRole` para el control de acceso y después busca la fila del
 * médico, porque la agenda se guarda por `medicoId`. Si la cuenta de Clerk
 * todavía no estaba vinculada (`clerkId` nulo), la vincula por email, igual
 * que `getCurrentAdmin`.
 */
export async function requireMedico() {
  await requireRole(["medico"]);

  const { userId } = await auth();
  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
  const prisma = getPrisma();
  const medico = await prisma.user.findFirst({
    where: {
      role: "MEDICO",
      OR: [
        ...(userId ? [{ clerkId: userId }] : []),
        ...(email ? [{ email }] : []),
      ],
    },
    select: {
      id: true,
      clerkId: true,
      firstName: true,
      lastName: true,
      matricula: true,
    },
  });

  if (!medico) {
    // Rol médico en Clerk pero sin fila en Neon: no hay dónde guardar su agenda.
    throw new Error("La cuenta médica no está registrada en la base de datos.");
  }

  if (!medico.clerkId && userId) {
    await prisma.user.update({
      where: { id: medico.id },
      data: { clerkId: userId },
    });
  }

  return {
    id: medico.id,
    firstName: medico.firstName,
    lastName: medico.lastName,
    matricula: medico.matricula,
  };
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPrisma } from "./prisma";

/** Mapea el `publicMetadata.role` de Clerk al enum `Role` de Prisma. */
function dbRoleFromClerk(role: unknown) {
  const r = typeof role === "string" ? role.toLowerCase() : "";
  switch (r) {
    case "admin":
    case "administrador":
      return "ADMINISTRADOR" as const;
    case "administrativo":
      return "ADMINISTRATIVO" as const;
    case "medico":
      return "MEDICO" as const;
    case "enfermera":
      return "ENFERMERA" as const;
    default:
      return "PACIENTE" as const;
  }
}

/**
 * Devuelve la fila `User` de Prisma del usuario autenticado en Clerk, o `null`
 * si no hay sesión. Reutiliza el mismo criterio de `getCurrentAdmin` (por
 * `clerkId`, con fallback por email), linkea `clerkId` si la fila existe por
 * email pero aún no tiene el vínculo, y CREA la fila si el usuario de Clerk no
 * tiene correspondencia (sync Clerk → DB): sin esto, un paciente que se
 * registra por Clerk queda sin fila `User` y no puede usar "Mi cobertura".
 */
export async function getCurrentDbUser() {
  const { userId } = await auth();

  if (!userId) {
    return null;
  }

  const user = await currentUser();
  const email = (
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress
  )?.toLowerCase();

  const prisma = getPrisma();
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: userId },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  if (dbUser && !dbUser.clerkId) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId: userId },
    });
  }

  // Sync: si el usuario de Clerk no tiene fila en la DB, se crea (PACIENTE por
  // defecto; staff invitado hereda su `publicMetadata.role`).
  if (!dbUser && email) {
    dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        email,
        firstName: user?.firstName ?? null,
        lastName: user?.lastName ?? null,
        role: dbRoleFromClerk(user?.publicMetadata?.role),
      },
    });
  }

  return dbUser;
}

export async function getCurrentAdmin() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase();

  // 1. Check Clerk publicMetadata role
  const clerkRole = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();
  const isAdminInClerk = clerkRole === "admin" || clerkRole === "administrador";

  // 2. Check Database role
  const prisma = getPrisma();
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: userId },
        ...(email ? [{ email }] : []),
      ],
    },
  });

  // If user exists in DB by email without clerkId, link it
  if (dbUser && !dbUser.clerkId) {
    dbUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: { clerkId: userId },
    });
  }

  if (dbUser && !dbUser.isActive) {
    redirect("/sign-in/error?reason=inactive-account");
  }

  const isAdminInDb = dbUser?.role === "ADMINISTRADOR";

  if (!isAdminInClerk && !isAdminInDb) {
    // Access denied for non-admin users
    redirect("/acceso-denegado");
  }

  return {
    clerkUser: user,
    dbUser,
    displayName:
      user?.firstName && user?.lastName
        ? `${user.firstName} ${user.lastName}`
        : user?.firstName || user?.username || "Administrador General",
  };
}

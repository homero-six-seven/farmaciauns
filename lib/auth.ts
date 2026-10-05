import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getPrisma } from "./prisma";

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

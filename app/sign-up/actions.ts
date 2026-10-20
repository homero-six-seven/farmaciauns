"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { getPrisma } from "@/lib/prisma";

type PatientRegistrationResult =
  | { success: true }
  | { success: false; message: string; retryable?: boolean };

export async function isPatientEmailAlreadyRegistered(
  email: string,
): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    return false;
  }

  const existingUser = await getPrisma().user.findFirst({
    where: {
      email: { equals: normalizedEmail, mode: "insensitive" },
    },
    select: { id: true },
  });

  return Boolean(existingUser);
}

export async function linkCurrentInvitedStaffAccount(): Promise<
  { success: true } | { success: false; message: string }
> {
  const { userId } = await auth();
  if (!userId) {
    return {
      success: false,
      message: "No se pudo verificar la sesión. Volvé a abrir el enlace de invitación.",
    };
  }

  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== userId) {
    return {
      success: false,
      message: "No se pudo verificar la cuenta. Volvé a abrir el enlace de invitación.",
    };
  }

  if (clerkUser.publicMetadata.farmaciaunsStaffInvite !== true) {
    return { success: true };
  }

  const role = clerkUser.publicMetadata.role;
  const databaseRole =
    role === "administrativo"
      ? "ADMINISTRATIVO"
      : role === "enfermera"
        ? "ENFERMERA"
        : role === "medico"
          ? "MEDICO"
          : null;

  if (!databaseRole) {
    return {
      success: false,
      message: "La invitación no corresponde a un perfil de personal válido.",
    };
  }

  const email = clerkUser.emailAddresses
    .find((address) => address.id === clerkUser.primaryEmailAddressId)
    ?.emailAddress.trim()
    .toLowerCase();

  if (!email) {
    return {
      success: false,
      message: "La cuenta no tiene un email principal para completar el alta.",
    };
  }

  const prisma = getPrisma();
  const linkedUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { role: true },
  });

  if (linkedUser?.role === databaseRole) {
    return { success: true };
  }

  const invitedUser = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      role: databaseRole,
      clerkId: null,
    },
    select: { id: true },
  });

  if (!invitedUser) {
    return {
      success: false,
      message:
        "No encontramos el registro de personal asociado a esta invitación. Contactá al administrador.",
    };
  }

  const result = await prisma.user.updateMany({
    where: { id: invitedUser.id, clerkId: null },
    data: { clerkId: userId },
  });

  if (result.count !== 1) {
    const linkedByAnotherRequest = await prisma.user.findUnique({
      where: { id: invitedUser.id },
      select: { clerkId: true },
    });

    if (linkedByAnotherRequest?.clerkId !== userId) {
      return {
        success: false,
        message:
          "No se pudo vincular la cuenta con el registro de personal. Contactá al administrador.",
      };
    }
  }

  return { success: true };
}

export async function registerCurrentUserAsPatient(): Promise<PatientRegistrationResult> {
  const { userId } = await auth();

  if (!userId) {
    return {
      success: false,
      message: "No se pudo verificar la sesión. Iniciá sesión e intentá de nuevo.",
    };
  }

  const clerkUser = await currentUser();
  if (!clerkUser || clerkUser.id !== userId) {
    return {
      success: false,
      message: "No se pudo verificar la cuenta. Iniciá sesión e intentá de nuevo.",
    };
  }

  const primaryEmail = clerkUser.emailAddresses.find(
    (address) => address.id === clerkUser.primaryEmailAddressId,
  )?.emailAddress;
  const email = primaryEmail?.trim().toLowerCase();

  if (!email) {
    return {
      success: false,
      message: "La cuenta no tiene un email principal para registrar.",
    };
  }

  const prisma = getPrisma();
  const linkedUser = await prisma.user.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });

  if (linkedUser) {
    return { success: true };
  }

  const existingUser = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  if (existingUser) {
    return {
      success: false,
      message: "No podés registrarte: este email ya está registrado en el sistema.",
      retryable: false,
    };
  }

  await prisma.user.create({
    data: {
      clerkId: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      role: "PACIENTE",
    },
  });

  return { success: true };
}

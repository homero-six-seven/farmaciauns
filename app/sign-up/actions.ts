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

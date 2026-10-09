"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  MSG_DNI_DUPLICADO,
  MSG_EMAIL_DUPLICADO,
  normalizarDni,
  validarDatosEnfermera,
  validarDatosMedico,
  validarDatosPaciente,
  validarDatosPersonalAdministrativo,
} from "@/lib/domain/usuario";
import { sendWelcomeEmail } from "@/lib/email";
import type { FormState } from "@/lib/form-state";
import { hashPassword } from "@/lib/password";
import { getPrisma } from "@/lib/prisma";
import { getUserRepository } from "@/lib/repository";
import { requireRole } from "@/lib/authorization";

function leerString(formData: FormData, campo: string): string {
  const valor = formData.get(campo);
  return typeof valor === "string" ? valor : "";
}

/** Parsea "YYYY-MM-DD" a `Date`. Devuelve `undefined` si no es válida. */
function parsearFechaNacimiento(valor: string): Date | undefined {
  if (!valor) {
    return undefined;
  }
  const d = new Date(`${valor}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * US-06 (RF-13) — Registro de paciente (autorregistro sin sesión).
 * Valida, crea un usuario PACIENTE activo y redirige a `/registro/exitoso`.
 */
export async function registrarPaciente(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const datos = {
    firstName: leerString(formData, "firstName"),
    lastName: leerString(formData, "lastName"),
    dni: leerString(formData, "dni"),
    birthDate: leerString(formData, "birthDate"),
    email: leerString(formData, "email"),
    phone: leerString(formData, "phone"),
    password: leerString(formData, "password"),
    confirmPassword: leerString(formData, "confirmPassword"),
  };

  const errores = validarDatosPaciente(datos);
  if (Object.keys(errores).length > 0) {
    return {
      errors: errores,
      values: {
        firstName: datos.firstName,
        lastName: datos.lastName,
        dni: datos.dni,
        birthDate: datos.birthDate,
        email: datos.email,
        phone: datos.phone,
      },
    };
  }

  const repo = getUserRepository();
  if (await repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (await repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  const passwordHash = await hashPassword(datos.password);
  await repo.create({
    firstName: datos.firstName,
    lastName: datos.lastName,
    dni: datos.dni,
    email: datos.email,
    phone: datos.phone,
    birthDate: parsearFechaNacimiento(datos.birthDate),
    passwordHash,
    role: "PACIENTE",
    active: true,
  });

  revalidatePath("/pacientes");
  redirect("/registro/exitoso");
}

/**
 * US-07 (RF-16) — Registrar personal administrativo (solo ADMINISTRADOR).
 * Valida, crea un usuario ADMINISTRATIVO activo en Neon, envía una invitación
 * de Clerk y redirige a la confirmación (US-08).
 */
export async function registrarPersonalAdministrativo(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  await requireRole(["admin"]);

  const datos = {
    firstName: leerString(formData, "firstName"),
    lastName: leerString(formData, "lastName"),
    dni: leerString(formData, "dni"),
    email: leerString(formData, "email"),
    phone: leerString(formData, "phone"),
  };

  const errores = validarDatosPersonalAdministrativo(datos);
  if (Object.keys(errores).length > 0) {
    return {
      errors: errores,
      values: {
        firstName: datos.firstName,
        lastName: datos.lastName,
        dni: datos.dni,
        email: datos.email,
        phone: datos.phone,
      },
    };
  }

  const prisma = getPrisma();
  const dni = normalizarDni(datos.dni);
  const email = datos.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { dni } })) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (
    await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })
  ) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  let invitationId: string;
  try {
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "administrativo", farmaciaunsStaffInvite: true },
      redirectUrl: "/sign-up",
    });
    invitationId = invitation.id;
  } catch (error) {
    console.error("Failed to send administrative staff invitation.", error);
    return {
      errors: {
        _form: "No se pudo enviar la invitación. Verificá el email e intentá más tarde.",
      },
    };
  }

  let usuarioId: string;
  try {
    const usuario = await prisma.user.create({
      data: {
        email,
        firstName: datos.firstName.trim(),
        lastName: datos.lastName.trim(),
        dni,
        phone: datos.phone.trim(),
        role: "ADMINISTRATIVO",
        isActive: true,
      },
      select: { id: true },
    });
    usuarioId = usuario.id;
  } catch (databaseError) {
    try {
      const clerk = await clerkClient();
      await clerk.invitations.revokeInvitation(invitationId);
    } catch (revokeError) {
      console.error(
        "Failed to revoke administrative staff invitation after Neon persistence failed.",
        { databaseError, revokeError },
      );
      return {
        errors: {
          _form:
            "No se pudo guardar el registro en Neon ni anular la invitación. Revisá Clerk antes de volver a intentarlo.",
        },
      };
    }

    console.error("Failed to persist administrative staff in Neon.", databaseError);
    return {
      errors: {
        _form:
          "No se pudo guardar el registro en Neon. La invitación fue anulada; intentá nuevamente.",
      },
    };
  }

  revalidatePath("/admin/personal");
  redirect(`/admin/personal/confirmacion?id=${encodeURIComponent(usuarioId)}`);
}

/**
 * US-04 (RF-10) — Registrar médico (solo ADMINISTRADOR).
 * Valida, crea un usuario MEDICO activo con su especialidad, dispara el STUB
 * de email de bienvenida y redirige a la confirmación (US-05) con el id.
 */
export async function registrarMedico(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  await requireRole(["admin"]);

  const datos = {
    firstName: leerString(formData, "firstName"),
    lastName: leerString(formData, "lastName"),
    dni: leerString(formData, "dni"),
    email: leerString(formData, "email"),
    phone: leerString(formData, "phone"),
    especialidad: leerString(formData, "especialidad"),
    matricula: leerString(formData, "matricula"),
    password: leerString(formData, "password"),
  };

  const errores = validarDatosMedico(datos);
  if (Object.keys(errores).length > 0) {
    return {
      errors: errores,
      values: {
        firstName: datos.firstName,
        lastName: datos.lastName,
        dni: datos.dni,
        email: datos.email,
        phone: datos.phone,
        especialidad: datos.especialidad,
        matricula: datos.matricula,
      },
    };
  }

  const repo = getUserRepository();
  if (await repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (await repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  const passwordHash = await hashPassword(datos.password);
  const usuario = await repo.create({
    firstName: datos.firstName,
    lastName: datos.lastName,
    dni: datos.dni,
    email: datos.email,
    phone: datos.phone,
    especialidad: datos.especialidad,
    matricula: datos.matricula,
    passwordHash,
    role: "MEDICO",
    active: true,
  });

  await sendWelcomeEmail(
    usuario.email ?? "",
    `${usuario.firstName ?? ""} ${usuario.lastName ?? ""}`.trim(),
  );

  revalidatePath("/admin/medicos");
  redirect(`/admin/medicos/confirmacion?id=${encodeURIComponent(usuario.id)}`);
}

/**
 * US-14 (RF-26) — Registrar enfermera (solo ADMINISTRADOR).
 * Valida los datos, guarda el usuario ENFERMERA en Neon, envía una invitación
 * de Clerk y redirige a la confirmación con el id del usuario creado.
 */
export async function registrarEnfermera(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  // Autorización real (las server actions son alcanzables por POST directo).
  await requireRole(["admin"]);

  const datos = {
    firstName: leerString(formData, "firstName"),
    lastName: leerString(formData, "lastName"),
    dni: leerString(formData, "dni"),
    email: leerString(formData, "email"),
    phone: leerString(formData, "phone"),
  };

  const errores = validarDatosEnfermera(datos);
  if (Object.keys(errores).length > 0) {
    return {
      errors: errores,
      values: {
        firstName: datos.firstName,
        lastName: datos.lastName,
        dni: datos.dni,
        email: datos.email,
        phone: datos.phone,
      },
    };
  }

  const prisma = getPrisma();
  const dni = normalizarDni(datos.dni);
  const email = datos.email.trim().toLowerCase();

  if (await prisma.user.findUnique({ where: { dni } })) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (
    await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    })
  ) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  let invitationId: string;
  try {
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: { role: "enfermera", farmaciaunsStaffInvite: true },
      redirectUrl: "/sign-up",
    });
    invitationId = invitation.id;
  } catch (error) {
    console.error("Failed to send nurse invitation.", error);
    return {
      errors: {
        _form:
          "No se pudo enviar la invitación desde Clerk. Revisá su configuración o intentá más tarde.",
      },
    };
  }

  let usuarioId: string;
  try {
    const usuario = await prisma.user.create({
      data: {
        email,
        firstName: datos.firstName.trim(),
        lastName: datos.lastName.trim(),
        dni,
        phone: datos.phone.trim(),
        role: "ENFERMERA",
        isActive: true,
      },
      select: { id: true },
    });
    usuarioId = usuario.id;
  } catch (databaseError) {
    try {
      const clerk = await clerkClient();
      await clerk.invitations.revokeInvitation(invitationId);
    } catch (revokeError) {
      console.error(
        "Failed to revoke nurse invitation after Neon persistence failed.",
        { databaseError, revokeError },
      );
      return {
        errors: {
          _form:
            "No se pudo guardar la enfermera en Neon y no se pudo anular su invitación. Revisá Clerk antes de volver a intentarlo.",
        },
      };
    }

    console.error("Failed to persist nurse in Neon after invitation.", databaseError);
    return {
      errors: {
        _form:
          "No se pudo guardar la enfermera en Neon. La invitación fue anulada; intentá nuevamente.",
      },
    };
  }

  revalidatePath("/admin/enfermeras");
  redirect(
    `/admin/enfermeras/confirmacion?id=${encodeURIComponent(usuarioId)}`,
  );
}

/**
 * Soft delete de usuario (solo ADMINISTRADOR).
 *
 * Marca al usuario como inactivo (`active=false` en dominio, `isActive=false`
 * en DB) en lugar de borrar la fila. Recibe el `id` por `FormData` desde el
 * panel de detalle del listado; si el id no viene (o no es string), es no-op.
 *
 * Revalida las 3 páginas de listado que muestran usuarios (médicos,
 * enfermeras y pacientes) para que el cambio se refleje en todas.
 */
export async function eliminarUsuario(formData: FormData): Promise<void> {
  // Autorización real (las server actions son alcanzables por POST directo).
  await requireRole(["admin"]);

  const id = formData.get("id");
  if (typeof id !== "string" || !id) {
    return;
  }

  await getUserRepository().deactivate(id);

  revalidatePath("/admin/medicos");
  revalidatePath("/admin/enfermeras");
  revalidatePath("/pacientes");
}

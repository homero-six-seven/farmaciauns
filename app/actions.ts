"use server";

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
import { sendPasswordResetEmail, sendWelcomeEmail } from "@/lib/email";
import type { FormState } from "@/lib/form-state";
import { hashPassword } from "@/lib/password";
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
  if (repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  const passwordHash = await hashPassword(datos.password);
  repo.create({
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
 * Valida, crea un usuario ADMINISTRATIVO activo, dispara el STUB de email y
 * redirige a la confirmación (US-08) con el id del usuario creado.
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
    password: leerString(formData, "password"),
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

  const repo = getUserRepository();
  if (repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  const passwordHash = await hashPassword(datos.password);
  const usuario = repo.create({
    firstName: datos.firstName,
    lastName: datos.lastName,
    dni: datos.dni,
    email: datos.email,
    phone: datos.phone,
    passwordHash,
    role: "ADMINISTRATIVO",
    active: true,
  });

  await sendPasswordResetEmail(usuario.email ?? "");

  revalidatePath("/admin/personal");
  redirect(`/admin/personal/confirmacion?id=${encodeURIComponent(usuario.id)}`);
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
  if (repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  const passwordHash = await hashPassword(datos.password);
  const usuario = repo.create({
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
 * Espejo de `registrarPersonalAdministrativo`: valida, crea un usuario
 * ENFERMERA activo, dispara el STUB de email de bienvenida y redirige a la
 * confirmación con el id del usuario creado.
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
    password: leerString(formData, "password"),
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

  const repo = getUserRepository();
  if (repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO } };
  }
  if (repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO } };
  }

  const passwordHash = await hashPassword(datos.password);
  const usuario = repo.create({
    firstName: datos.firstName,
    lastName: datos.lastName,
    dni: datos.dni,
    email: datos.email,
    phone: datos.phone,
    passwordHash,
    role: "ENFERMERA",
    active: true,
  });

  await sendWelcomeEmail(
    usuario.email ?? "",
    `${usuario.firstName ?? ""} ${usuario.lastName ?? ""}`.trim(),
  );

  revalidatePath("/admin/enfermeras");
  redirect(
    `/admin/enfermeras/confirmacion?id=${encodeURIComponent(usuario.id)}`,
  );
}

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
import { normalizeRole, requireRole, type Role } from "@/lib/authorization";
import { getCurrentDbUser } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import {
  agregarCoberturaAMedico,
  asignarCoberturaAPaciente,
  listarCoberturasDisponibles,
  quitarCoberturaDeMedico,
} from "@/lib/cobertura-service";
import {
  MSG_AFILIADO_OBLIGATORIO,
  MSG_COBERTURA_NO_DISPONIBLE,
} from "@/lib/domain/cobertura";
import { registrarIngreso, registrarEgreso } from "@/lib/stock-service";
import {
  MSG_CANTIDAD_INVALIDA,
  MSG_DETALLE_OBLIGATORIO,
  MSG_MOTIVO_INVALIDO,
  MSG_MOTIVO_OBLIGATORIO,
  MSG_STOCK_INSUFICIENTE,
} from "@/lib/domain/vacuna";

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
  const coberturaId = leerString(formData, "coberturaId");
  const numeroAfiliado = leerString(formData, "numeroAfiliado");

  const valores = {
    firstName: datos.firstName,
    lastName: datos.lastName,
    dni: datos.dni,
    birthDate: datos.birthDate,
    email: datos.email,
    phone: datos.phone,
    coberturaId,
    numeroAfiliado,
  };

  const errores = validarDatosPaciente(datos);
  if (Object.keys(errores).length > 0) {
    return { errors: errores, values: valores };
  }

  const repo = getUserRepository();
  if (await repo.findByDni(normalizarDni(datos.dni))) {
    return { errors: { dni: MSG_DNI_DUPLICADO }, values: valores };
  }
  if (await repo.findByEmail(datos.email)) {
    return { errors: { email: MSG_EMAIL_DUPLICADO }, values: valores };
  }

  // Validación de cobertura (US-21): si elige una cobertura, debe estar
  // disponible y el nº de afiliado es obligatorio. Requiere la DB (Neon).
  const usaCoberturas = Boolean(process.env.DATABASE_URL?.trim());
  if (usaCoberturas && coberturaId) {
    const disponibles = await listarCoberturasDisponibles();
    if (!disponibles.some((c) => c.id === coberturaId)) {
      return {
        errors: { coberturaId: MSG_COBERTURA_NO_DISPONIBLE },
        values: valores,
      };
    }
    if (!numeroAfiliado.trim()) {
      return {
        errors: { numeroAfiliado: MSG_AFILIADO_OBLIGATORIO },
        values: valores,
      };
    }
  }

  const passwordHash = await hashPassword(datos.password);
  const usuario = await repo.create({
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

  if (usaCoberturas && coberturaId) {
    await asignarCoberturaAPaciente(usuario.id, coberturaId, numeroAfiliado);
  }

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

// ---------------------------------------------------------------------------
// Coberturas Médicas (RF-05b) y Stock de Vacunas (RF-04a)
// ---------------------------------------------------------------------------

/**
 * Devuelve el id de la fila `User` autenticada si su rol está permitido; si
 * no, redirige (mismo criterio que `requireRole`, pero retorna el id para
 * usarlo como FK).
 */
async function idUsuarioActual(
  rolesPermitidos: readonly Role[],
): Promise<string> {
  const dbUser = await getCurrentDbUser();
  if (!dbUser || !dbUser.isActive) {
    redirect("/sign-in");
  }
  const role = normalizeRole(String(dbUser.role));
  if (!role || !rolesPermitidos.includes(role)) {
    redirect("/prototipos/pantalla_6_acceso_denegado");
  }
  return dbUser.id;
}

/**
 * US-20 — Agregar una cobertura a "Mis coberturas" (solo MEDICO).
 * Reutiliza el catálogo existente (case-insensitive) para no duplicar.
 */
export async function agregarCobertura(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const medicoId = await idUsuarioActual(["medico"]);
  const nombre = leerString(formData, "nombre");

  try {
    await agregarCoberturaAMedico(medicoId, nombre);
  } catch (err) {
    return err instanceof ApiError
      ? { errors: { _form: err.message }, values: { nombre } }
      : { errors: { _form: "Error inesperado" }, values: { nombre } };
  }

  revalidatePath("/coberturas");
  redirect("/coberturas");
}

/**
 * US-20 — Quitar una cobertura de "Mis coberturas" (solo MEDICO).
 * Borra solo el vínculo; los pacientes que ya la tienen la conservan.
 */
export async function quitarCobertura(formData: FormData): Promise<void> {
  const medicoId = await idUsuarioActual(["medico"]);
  const coberturaId = formData.get("coberturaId");
  if (typeof coberturaId !== "string" || !coberturaId) {
    return;
  }
  try {
    await quitarCoberturaDeMedico(medicoId, coberturaId);
  } catch {
    // no-op: se revalida y se muestra el estado actual.
  }
  revalidatePath("/coberturas");
}

/** Mapea un `ApiError` de stock al campo del formulario que corresponde. */
function errorStock(err: unknown, valores: Record<string, string>): FormState {
  if (err instanceof ApiError) {
    const campo =
      err.message === MSG_CANTIDAD_INVALIDA || err.message === MSG_STOCK_INSUFICIENTE
        ? "cantidad"
        : err.message === MSG_MOTIVO_OBLIGATORIO ||
            err.message === MSG_MOTIVO_INVALIDO
          ? "motivo"
          : err.message === MSG_DETALLE_OBLIGATORIO
            ? "motivoDetalle"
            : "_form";
    return { errors: { [campo]: err.message }, values: valores };
  }
  return { errors: { _form: "Error inesperado" }, values: valores };
}

/** US-22 — Registrar ingreso de stock (solo ENFERMERA). */
export async function registrarIngresoStock(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const enfermeraId = await idUsuarioActual(["enfermera"]);
  const vacunaId = leerString(formData, "vacunaId");
  const cantidadTexto = leerString(formData, "cantidad");
  const cantidad = Number.parseInt(cantidadTexto, 10);
  const valores = { vacunaId, cantidad: cantidadTexto };

  try {
    await registrarIngreso(
      vacunaId,
      Number.isNaN(cantidad) ? NaN : cantidad,
      enfermeraId,
    );
  } catch (err) {
    return errorStock(err, valores);
  }

  revalidatePath("/stock");
  redirect("/stock");
}

/** US-23 — Registrar egreso/ajuste de stock (solo ENFERMERA). */
export async function registrarEgresoStock(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const enfermeraId = await idUsuarioActual(["enfermera"]);
  const vacunaId = leerString(formData, "vacunaId");
  const cantidadTexto = leerString(formData, "cantidad");
  const cantidad = Number.parseInt(cantidadTexto, 10);
  const motivo = leerString(formData, "motivo");
  const motivoDetalle = leerString(formData, "motivoDetalle");
  const valores = {
    vacunaId,
    cantidad: cantidadTexto,
    motivo,
    motivoDetalle,
  };

  try {
    await registrarEgreso(
      vacunaId,
      Number.isNaN(cantidad) ? NaN : cantidad,
      motivo,
      motivoDetalle,
      enfermeraId,
    );
  } catch (err) {
    return errorStock(err, valores);
  }

  revalidatePath("/stock");
  redirect("/stock");
}

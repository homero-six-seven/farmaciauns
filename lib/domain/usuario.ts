/**
 * Dominio de "Usuario" — tipos y validaciones PURAS.
 *
 * Acá NO hay I/O: ni Next.js, ni Prisma, ni `node:crypto`, ni `process.env`.
 * Todo lo que exporta este módulo es determinista y testable de forma aislada.
 *
 * El modelo canónico de persistencia es `prisma/schema.prisma` (model `User`).
 * Este tipo `Usuario` es su espejo en la capa de dominio; cuando exista
 * `DATABASE_URL` y se migre a Prisma, se mapea 1:1 (ver docs/CAMBIOS-US-GRUPO1.md).
 */

export type Role =
  | "ADMINISTRADOR"
  | "MEDICO"
  | "PACIENTE"
  | "ADMINISTRATIVO"
  | "ENFERMERA";

export const ROLES: Role[] = [
  "ADMINISTRADOR",
  "MEDICO",
  "PACIENTE",
  "ADMINISTRATIVO",
  "ENFERMERA",
];

/** Especialidades médicas disponibles (lista fija, US-04 / RF-10). */
export const ESPECIALIDADES = [
  "Clínica médica",
  "Pediatría",
  "Traumatología",
] as const;

export type Especialidad = (typeof ESPECIALIDADES)[number];

/** Espejo de dominio del modelo `User` de Prisma. */
export interface Usuario {
  id: string;
  clerkId?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  dni?: string | null;
  phone?: string | null;
  birthDate?: Date | null;
  /** Solo relevante para MEDICO; `null` para el resto de roles. */
  especialidad?: string | null;
  /** Matrícula profesional; solo relevante para MEDICO; `null` para el resto. */
  matricula?: string | null;
  passwordHash?: string | null;
  role: Role;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Vista pública y serializable de un usuario: NUNCA incluye `passwordHash`
 * ni `clerkId`. Es lo que se manda a las pantallas de listado/detalle.
 */
export type UsuarioPublico = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  birthDate: string | null;
  especialidad: string | null;
  matricula: string | null;
  role: Role;
  active: boolean;
};

/** Convierte un `Usuario` en su vista pública (sin contraseña ni clerkId). */
export function toUsuarioPublico(u: Usuario): UsuarioPublico {
  return {
    id: u.id,
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    dni: u.dni ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    birthDate: u.birthDate ? u.birthDate.toISOString() : null,
    especialidad: u.especialidad ?? null,
    matricula: u.matricula ?? null,
    role: u.role,
    active: u.active,
  };
}

// ---------------------------------------------------------------------------
// Mensajes de error exactos (requeridos por las historias de usuario)
// ---------------------------------------------------------------------------

export const MSG_DNI_DUPLICADO = "El DNI ya está registrado";
export const MSG_EMAIL_DUPLICADO = "El email ya está registrado";
export const MSG_CAMPO_OBLIGATORIO = "Campo obligatorio";
export const MSG_PASSWORD_MIN = "Debe tener al menos 8 caracteres";
export const MSG_PASSWORDS_NO_COINCIDEN = "Las contraseñas no coinciden";
// Mensajes de formato (no están en la lista "exacta" de las US, pero son
// necesarios para cumplir "validar DNI (numérico/sin puntos)" y
// "validar email (formato)" del plan). Documentados en docs/CAMBIOS-US-GRUPO1.md.
export const MSG_DNI_FORMATO = "El DNI debe contener solo números";
export const MSG_DNI_MIN = "El DNI debe tener al menos 7 dígitos";
export const MSG_EMAIL_FORMATO = "El email no tiene un formato válido";
export const MSG_TELEFONO_FORMATO = "El teléfono debe contener solo números";

/** Mapa campo -> mensaje de error. Las claves coinciden con el `name` del input. */
export type CampoError = Record<string, string>;

// ---------------------------------------------------------------------------
// Validaciones atómicas (puras)
// ---------------------------------------------------------------------------

export function esVacio(value: string | null | undefined): boolean {
  return value == null || value.trim() === "";
}

/** Normaliza un DNI quitando puntos, espacios y guiones ("32.841.902" -> "32841902"). */
export function normalizarDni(dni: string): string {
  return dni.replace(/[.\s-]/g, "");
}

/** True si el DNI (luego de normalizar) es numérico y no vacío. */
export function validarDniFormato(dni: string): boolean {
  const n = normalizarDni(dni);
  return /^\d+$/.test(n);
}

/** True si el DNI (luego de normalizar) tiene al menos 7 dígitos. */
export function validarDniLongitud(dni: string): boolean {
  return normalizarDni(dni).length >= 7;
}

/** True si el teléfono contiene solo números (admite separadores +, espacio, guion, paréntesis). */
export function validarTelefonoFormato(phone: string): boolean {
  const limpio = phone.replace(/[+\s()-]/g, "");
  return limpio.length > 0 && /^\d+$/.test(limpio);
}

/** True si el email tiene un formato básico válido. */
export function validarEmailFormato(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** True si la contraseña cumple el mínimo de 8 caracteres. */
export function validarPassword(password: string): boolean {
  return password.length >= 8;
}

function validarObligatorio(
  valor: string | null | undefined,
  campo: string,
  errores: CampoError,
): void {
  if (esVacio(valor)) {
    errores[campo] = MSG_CAMPO_OBLIGATORIO;
  }
}

// ---------------------------------------------------------------------------
// Validación por formulario (compone las validaciones atómicas)
// ---------------------------------------------------------------------------

export interface DatosRegistroPaciente {
  firstName: string;
  lastName: string;
  dni: string;
  birthDate: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface DatosPersonalAdministrativo {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  password: string;
}

export interface DatosMedico {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  especialidad: string;
  matricula: string;
  password: string;
}

/** Alta de enfermera (US-14): los MISMOS campos que el personal administrativo. */
export interface DatosEnfermera {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  phone: string;
  password: string;
}

function validarDniYEmail(dni: string, email: string, errores: CampoError): void {
  if (esVacio(dni)) {
    errores.dni = MSG_CAMPO_OBLIGATORIO;
  } else if (!validarDniFormato(dni)) {
    errores.dni = MSG_DNI_FORMATO;
  } else if (!validarDniLongitud(dni)) {
    errores.dni = MSG_DNI_MIN;
  }

  if (esVacio(email)) {
    errores.email = MSG_CAMPO_OBLIGATORIO;
  } else if (!validarEmailFormato(email)) {
    errores.email = MSG_EMAIL_FORMATO;
  }
}

function validarTelefono(phone: string, errores: CampoError): void {
  if (esVacio(phone)) {
    errores.phone = MSG_CAMPO_OBLIGATORIO;
  } else if (!validarTelefonoFormato(phone)) {
    errores.phone = MSG_TELEFONO_FORMATO;
  }
}

function validarPasswordUnica(password: string, errores: CampoError): void {
  if (esVacio(password)) {
    errores.password = MSG_CAMPO_OBLIGATORIO;
  } else if (!validarPassword(password)) {
    errores.password = MSG_PASSWORD_MIN;
  }
}

/**
 * Valida los campos del registro de paciente (US-06).
 * NO valida unicidad de DNI/email: eso requiere el repositorio (I/O).
 */
export function validarDatosPaciente(d: DatosRegistroPaciente): CampoError {
  const errores: CampoError = {};

  validarObligatorio(d.firstName, "firstName", errores);
  validarObligatorio(d.lastName, "lastName", errores);
  validarObligatorio(d.birthDate, "birthDate", errores);
  validarTelefono(d.phone, errores);

  validarDniYEmail(d.dni, d.email, errores);
  validarPasswordUnica(d.password, errores);

  if (esVacio(d.confirmPassword)) {
    errores.confirmPassword = MSG_CAMPO_OBLIGATORIO;
  } else if (
    !esVacio(d.password) &&
    validarPassword(d.password) &&
    d.password !== d.confirmPassword
  ) {
    errores.confirmPassword = MSG_PASSWORDS_NO_COINCIDEN;
  }

  return errores;
}

/**
 * Validación compartida del alta de staff (personal administrativo y
 * enfermería): comparten los MISMOS campos (nombre, apellido, dni, email,
 * phone, password).
 * NO valida unicidad de DNI/email: eso requiere el repositorio (I/O).
 */
function validarDatosAltaStaff(
  d: DatosPersonalAdministrativo,
): CampoError {
  const errores: CampoError = {};

  validarObligatorio(d.firstName, "firstName", errores);
  validarObligatorio(d.lastName, "lastName", errores);
  validarTelefono(d.phone, errores);

  validarDniYEmail(d.dni, d.email, errores);
  validarPasswordUnica(d.password, errores);

  return errores;
}

/**
 * Valida los campos del alta de personal administrativo (US-07).
 * NO valida unicidad de DNI/email: eso requiere el repositorio (I/O).
 */
export function validarDatosPersonalAdministrativo(
  d: DatosPersonalAdministrativo,
): CampoError {
  return validarDatosAltaStaff(d);
}

/**
 * Valida los campos del alta de enfermera (US-14). Reutiliza la misma lógica
 * que el alta de personal administrativo (mismos campos).
 * NO valida unicidad de DNI/email: eso requiere el repositorio (I/O).
 */
export function validarDatosEnfermera(d: DatosEnfermera): CampoError {
  return validarDatosAltaStaff(d);
}

/**
 * Valida los campos del alta de médico (US-04). Espejo de
 * `validarDatosPersonalAdministrativo`, más la especialidad obligatoria.
 * NO valida unicidad de DNI/email: eso requiere el repositorio (I/O).
 */
export function validarDatosMedico(d: DatosMedico): CampoError {
  const errores: CampoError = {};

  validarObligatorio(d.firstName, "firstName", errores);
  validarObligatorio(d.lastName, "lastName", errores);
  validarTelefono(d.phone, errores);

  validarObligatorio(d.especialidad, "especialidad", errores);
  // Guard defensivo: el `<select>` ya restringe a la lista, pero por POST
  // directo podría llegar un valor fuera de `ESPECIALIDADES`. No existe un
  // mensaje exacto de las US para "fuera de lista", así que se mapea a
  // `Campo obligatorio` (ver design → Open Questions).
  if (
    !esVacio(d.especialidad) &&
    !(ESPECIALIDADES as readonly string[]).includes(d.especialidad)
  ) {
    errores.especialidad = MSG_CAMPO_OBLIGATORIO;
  }

  validarObligatorio(d.matricula, "matricula", errores);

  validarDniYEmail(d.dni, d.email, errores);
  validarPasswordUnica(d.password, errores);

  return errores;
}

/** Etiqueta legible de un rol para las pantallas de resumen. */
export function etiquetaRol(role: Role): string {
  switch (role) {
    case "ADMINISTRADOR":
      return "Administrador";
    case "MEDICO":
      return "Médico";
    case "PACIENTE":
      return "Paciente";
    case "ADMINISTRATIVO":
      return "Personal administrativo";
    case "ENFERMERA":
      return "Enfermera";
    default:
      return role;
  }
}

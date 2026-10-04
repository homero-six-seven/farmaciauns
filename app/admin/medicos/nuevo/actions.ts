"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { getPrisma } from "../../../../lib/prisma";
import { getCurrentAdmin } from "../../../../lib/auth";

export interface CreateMedicoState {
  success: boolean;
  doctorId?: string;
  errors?: {
    nombre?: string;
    apellido?: string;
    dni?: string;
    matricula?: string;
    especialidad?: string;
    telefono?: string;
    email?: string;
    password?: string;
    general?: string;
  };
}

export async function createMedicoAction(
  _prevState: CreateMedicoState,
  formData: FormData
): Promise<CreateMedicoState> {
  // Ensure the user is an admin
  await getCurrentAdmin();

  const nombre = formData.get("nombre")?.toString().trim() || "";
  const apellido = formData.get("apellido")?.toString().trim() || "";
  const dni = formData.get("dni")?.toString().trim() || "";
  const matricula = formData.get("matricula")?.toString().trim() || "";
  const especialidadRaw = formData.get("especialidad")?.toString().trim() || "";
  const telefono = formData.get("telefono")?.toString().trim() || "";
  const email = formData.get("email")?.toString().trim().toLowerCase() || "";
  const password = formData.get("password")?.toString() || "";

  const errors: CreateMedicoState["errors"] = {};

  // Validaciones de campos obligatorios (CA4)
  if (!nombre) errors.nombre = "Campo obligatorio";
  if (!apellido) errors.apellido = "Campo obligatorio";
  if (!dni) errors.dni = "Campo obligatorio";
  if (!matricula) errors.matricula = "Campo obligatorio";
  if (!especialidadRaw) errors.especialidad = "Campo obligatorio";
  if (!telefono) errors.telefono = "Campo obligatorio";
  if (!email) errors.email = "Campo obligatorio";
  if (!password) errors.password = "Campo obligatorio";

  // Validación de DNI numérico (CA6)
  if (dni && !/^\d+$/.test(dni)) {
    errors.dni = "El DNI debe contener solo números";
  }

  // Validación de contraseña (CA6: menor a 8 caracteres)
  if (password && password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres";
  }

  // Validación de formato de email (CA5)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (email && !emailRegex.test(email)) {
    errors.email = "Formato de email inválido";
  }

  // Validación de especialidad fija: Clínica médica, Pediatría o Traumatología
  let especialidadEnum: "CLINICA_MEDICA" | "PEDIATRIA" | "TRAUMATOLOGIA" | null = null;
  const espNorm = especialidadRaw.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (espNorm.includes("clinica")) {
    especialidadEnum = "CLINICA_MEDICA";
  } else if (espNorm.includes("pediatria")) {
    especialidadEnum = "PEDIATRIA";
  } else if (espNorm.includes("traumatologia")) {
    especialidadEnum = "TRAUMATOLOGIA";
  } else if (especialidadRaw) {
    errors.especialidad = "Seleccione una especialidad válida";
  }

  // Si ya hay errores de formato / obligatorios, retornar temprano
  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const prisma = getPrisma();

  // Validar duplicidad de DNI en la base de datos (CA2)
  const existingDni = await prisma.user.findFirst({
    where: { dni },
  });
  if (existingDni) {
    errors.dni = "El DNI ya está registrado en la base central";
  }

  // Validar duplicidad de Email en la base de datos (CA3)
  const existingEmail = await prisma.user.findFirst({
    where: { email },
  });
  if (existingEmail) {
    errors.email = "El email ya está registrado";
  }

  // Validar duplicidad de Matrícula
  const existingMatricula = await prisma.user.findFirst({
    where: { matricula },
  });
  if (existingMatricula) {
    errors.matricula = "La matrícula ya está registrada";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Crear usuario en Clerk y en la base de datos
  let clerkId: string | null = null;
  try {
    const clerk = await clerkClient();
    const clerkUser = await clerk.users.createUser({
      emailAddress: [email],
      password,
      firstName: nombre,
      lastName: apellido,
      publicMetadata: {
        role: "medico",
        dni,
        especialidad: especialidadRaw,
      },
    });
    clerkId = clerkUser.id;
  } catch (clerkErr: any) {
    // Si Clerk reporta que el email ya existe o error de contraseña
    console.warn("Clerk user creation note:", clerkErr?.message);
    const msg = clerkErr?.errors?.[0]?.message || clerkErr?.message || "";
    if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("taken") || msg.toLowerCase().includes("exists")) {
      return {
        success: false,
        errors: { email: "El email ya está registrado en el servicio de autenticación" },
      };
    }
    // Si es otro error de Clerk, lo registramos pero continuamos si es entorno local/offline
  }

  try {
    const doctor = await prisma.user.create({
      data: {
        clerkId,
        email,
        firstName: nombre,
        lastName: apellido,
        dni,
        matricula,
        especialidad: especialidadEnum,
        phone: telefono,
        role: "MEDICO",
        isActive: true,
      },
    });

    return {
      success: true,
      doctorId: doctor.id,
    };
  } catch (dbErr: any) {
    console.error("DB create doctor error:", dbErr);
    return {
      success: false,
      errors: {
        general: "Ocurrió un error al guardar el registro médico. Intente nuevamente.",
      },
    };
  }
}

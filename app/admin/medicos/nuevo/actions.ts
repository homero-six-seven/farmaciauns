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
    general?: string;
  };
  // Valores ingresados, para no vaciar el formulario cuando hay errores (sin la contraseña)
  values?: Record<string, string>;
}

function getClerkErrorDetails(error: unknown): {
  message: string;
  code: string;
  nestedMessage: string;
} {
  if (!error || typeof error !== "object") {
    return { message: "", code: "", nestedMessage: "" };
  }

  const details = error as {
    message?: unknown;
    errors?: Array<{ message?: unknown; code?: unknown }>;
  };
  const firstError = details.errors?.[0];

  return {
    message: typeof details.message === "string" ? details.message : "",
    code: typeof firstError?.code === "string" ? firstError.code : "",
    nestedMessage:
      typeof firstError?.message === "string" ? firstError.message : "",
  };
}

export async function createMedicoAction(
  prevState: CreateMedicoState,
  formData: FormData
): Promise<CreateMedicoState> {
  const result = await createMedico(prevState, formData);
  if (result.success) return result;

  const values: Record<string, string> = {};
  for (const campo of ["nombre", "apellido", "dni", "matricula", "especialidad", "telefono", "email"]) {
    values[campo] = formData.get(campo)?.toString() ?? "";
  }
  return { ...result, values };
}

async function createMedico(
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

  const errors: CreateMedicoState["errors"] = {};

  // Validaciones de campos obligatorios (CA4)
  if (!nombre) errors.nombre = "Campo obligatorio";
  if (!apellido) errors.apellido = "Campo obligatorio";
  if (!dni) errors.dni = "Campo obligatorio";
  if (!matricula) errors.matricula = "Campo obligatorio";
  if (!especialidadRaw) errors.especialidad = "Campo obligatorio";
  if (!telefono) errors.telefono = "Campo obligatorio";
  if (!email) errors.email = "Campo obligatorio";

  // Validación de DNI numérico (CA6)
  if (dni && !/^\d+$/.test(dni)) {
    errors.dni = "El DNI debe contener solo números";
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

  const prisma = getPrisma();

  // Los duplicados se informan aunque haya errores en otros campos;
  // solo se consulta por los campos que pasaron su propia validación.

  // Validar duplicidad de DNI en la base de datos (CA2)
  if (!errors.dni && (await prisma.user.findFirst({ where: { dni } }))) {
    errors.dni = "El DNI ya está registrado en la base central";
  }

  // Validar duplicidad de Email en la base de datos (CA3)
  if (!errors.email && (await prisma.user.findFirst({ where: { email } }))) {
    errors.email = "El email ya está registrado";
  }

  // Validar duplicidad de Matrícula
  if (!errors.matricula && (await prisma.user.findFirst({ where: { matricula } }))) {
    errors.matricula = "La matrícula ya está registrada";
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  let invitationId: string;
  try {
    const clerk = await clerkClient();
    const invitation = await clerk.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: "/sign-up",
      publicMetadata: {
        role: "medico",
        farmaciaunsStaffInvite: true,
        dni,
        especialidad: especialidadRaw,
      },
    });
    invitationId = invitation.id;
  } catch (clerkErr: unknown) {
    const { code, message, nestedMessage } = getClerkErrorDetails(clerkErr);
    console.warn("Clerk doctor invitation failed:", message);
    const msg = nestedMessage || message;
    if (msg.toLowerCase().includes("email") || msg.toLowerCase().includes("taken") || msg.toLowerCase().includes("exists")) {
      return {
        success: false,
        errors: { email: "El email ya tiene una cuenta o invitación en el servicio de autenticación" },
      };
    }
    console.error("Clerk doctor invitation error code:", code);
    return {
      success: false,
      errors: {
        general: "No se pudo enviar la invitación al médico. Intente nuevamente.",
      },
    };
  }

  try {
    const doctor = await prisma.user.create({
      data: {
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
  } catch (dbErr: unknown) {
    try {
      const clerk = await clerkClient();
      await clerk.invitations.revokeInvitation(invitationId);
    } catch (revokeErr: unknown) {
      console.error("Failed to revoke doctor invitation after Neon persistence failed.", {
        dbErr,
        revokeErr,
      });
      return {
        success: false,
        errors: {
          general:
            "No se pudo guardar el médico en Neon ni anular la invitación. Revisá Clerk antes de volver a intentarlo.",
        },
      };
    }

    console.error("Failed to persist doctor in Neon after invitation.", dbErr);
    return {
      success: false,
      errors: {
        general:
          "No se pudo guardar el médico en Neon. La invitación fue anulada; intentá nuevamente.",
      },
    };
  }
}

import type { $Enums, Prisma } from "@/generated/prisma/client";
import { ApiError } from "./api";
import { especialidadFromEnum } from "./prisma-user-repository";
import { getPrisma } from "./prisma";
import { aFechaISO } from "./fecha-db";

export const MEDIOS_PAGO = ["Efectivo", "Débito", "Crédito", "Transferencia"] as const;
export type MedioPagoLabel = (typeof MEDIOS_PAGO)[number];

const MEDIO_PAGO_ENUM: Record<MedioPagoLabel, $Enums.MedioPago> = {
  Efectivo: "EFECTIVO",
  Débito: "DEBITO",
  Crédito: "CREDITO",
  Transferencia: "TRANSFERENCIA",
};

function nombreCompleto(persona: { firstName: string | null; lastName: string | null }) {
  return `${persona.firstName ?? ""} ${persona.lastName ?? ""}`.trim();
}

function hora(minutos: number) {
  return `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;
}

function fecha(fechaPago: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fechaPago);
}

function horaPago(fechaPago: Date) {
  return new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(fechaPago);
}

function medioPagoLabel(medio: $Enums.MedioPago): MedioPagoLabel {
  const labels: Record<$Enums.MedioPago, MedioPagoLabel> = {
    EFECTIVO: "Efectivo",
    DEBITO: "Débito",
    CREDITO: "Crédito",
    TRANSFERENCIA: "Transferencia",
  };
  return labels[medio];
}

export async function obtenerComprobantePorPagoId(id: string) {
  const pago = await getPrisma().pago.findUnique({
    where: { id },
    include: {
      paciente: { select: { firstName: true, lastName: true, dni: true, numeroAfiliado: true, esParticular: true, cobertura: { select: { nombre: true } } } },
      turno: {
        select: {
          fecha: true,
          inicioMin: true,
          especialidad: true,
          medico: { select: { firstName: true, lastName: true, especialidad: true } },
        },
      },
    },
  });
  if (!pago) throw new ApiError(404, "Comprobante no encontrado");

  return {
    id: pago.id,
    correlativo: `0001-${String(pago.numeroComprobante).padStart(8, "0")}`,
    numeroComprobante: pago.numeroComprobante,
    fechaPago: fecha(pago.createdAt),
    horaPago: horaPago(pago.createdAt),
    importe: pago.importe.toString(),
    medioPago: medioPagoLabel(pago.medioPago),
    paciente: {
      nombre: nombreCompleto(pago.paciente),
      dni: pago.paciente.dni,
      cobertura: pago.paciente.cobertura?.nombre ?? (pago.paciente.esParticular ? "Particular" : null),
      numeroAfiliado: pago.paciente.numeroAfiliado,
    },
    consulta: {
      medico: pago.turno.medico ? nombreCompleto(pago.turno.medico) : "Sin profesional",
      especialidad: especialidadFromEnum(pago.turno.especialidad ?? pago.turno.medico?.especialidad ?? null),
      fecha: aFechaISO(pago.turno.fecha),
      hora: hora(pago.turno.inicioMin),
    },
  };
}

export async function listarPagosDePaciente(pacienteId: string) {
  const paciente = await getPrisma().user.findFirst({
    where: { id: pacienteId, role: "PACIENTE", isActive: true },
    select: {
      id: true,
      dni: true,
      cobertura: { select: { nombre: true } },
      esParticular: true,
      pagosComoPaciente: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          importe: true,
          medioPago: true,
          createdAt: true,
          turno: {
            select: {
              fecha: true,
              inicioMin: true,
              medico: { select: { firstName: true, lastName: true } },
            },
          },
        },
      },
    },
  });

  if (!paciente) throw new ApiError(404, "Paciente no encontrado");

  return {
    paciente: {
      dni: paciente.dni,
      cobertura: paciente.cobertura?.nombre ?? (paciente.esParticular ? "Particular" : null),
    },
    pagos: paciente.pagosComoPaciente.map((pago) => ({
      id: pago.id,
      fechaPago: fecha(pago.createdAt),
      horaPago: horaPago(pago.createdAt),
      importe: pago.importe.toString(),
      medioPago: medioPagoLabel(pago.medioPago),
      consulta: {
        medico: pago.turno.medico ? nombreCompleto(pago.turno.medico) : "Sin profesional",
        fecha: aFechaISO(pago.turno.fecha),
        hora: hora(pago.turno.inicioMin),
      },
    })),
  };
}

export async function pagoPerteneceAPaciente(pagoId: string, pacienteId: string) {
  const pago = await getPrisma().pago.findUnique({
    where: { id: pagoId },
    select: { pacienteId: true },
  });
  return pago?.pacienteId === pacienteId;
}

export async function buscarPacientesParaPago(query: string) {
  const termino = query.trim();
  if (!termino) return [];
  const dniNormalizado = termino.replace(/[.\s-]/g, "");
  const palabras = termino.split(/\s+/).filter(Boolean);
  const condiciones: Prisma.UserWhereInput[] = [
    { dni: { contains: termino } },
    ...(dniNormalizado !== termino ? [{ dni: { contains: dniNormalizado } }] : []),
    { lastName: { contains: termino, mode: "insensitive" as const } },
    { firstName: { contains: termino, mode: "insensitive" as const } },
  ];
  if (palabras.length > 1) {
    condiciones.push(
      {
        AND: [
          { firstName: { contains: palabras[0], mode: "insensitive" as const } },
          { lastName: { contains: palabras.slice(1).join(" "), mode: "insensitive" as const } },
        ],
      },
      {
        AND: [
          { lastName: { contains: palabras[0], mode: "insensitive" as const } },
          { firstName: { contains: palabras.slice(1).join(" "), mode: "insensitive" as const } },
        ],
      },
    );
  }

  const pacientes = await getPrisma().user.findMany({
    where: {
      role: "PACIENTE",
      isActive: true,
      OR: condiciones,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 10,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dni: true,
      cobertura: { select: { nombre: true } },
      numeroAfiliado: true,
      esParticular: true,
    },
  });

  return pacientes.map((paciente) => ({
    id: paciente.id,
    nombreCompleto: nombreCompleto(paciente),
    dni: paciente.dni,
    cobertura: paciente.cobertura?.nombre ?? (paciente.esParticular ? "Particular" : null),
    numeroAfiliado: paciente.numeroAfiliado,
  }));
}

export async function obtenerConsultasPendientesDePago(pacienteId: string) {
  const paciente = await getPrisma().user.findFirst({
    where: { id: pacienteId, role: "PACIENTE", isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      dni: true,
      cobertura: { select: { nombre: true } },
      numeroAfiliado: true,
      esParticular: true,
      turnosComoPaciente: {
        where: {
          tipo: "CONSULTA",
          estado: { in: ["RESERVADO", "ATENDIDO"] },
          estadoCobro: "PENDIENTE_DE_PAGO",
        },
        orderBy: [{ fecha: "asc" }, { inicioMin: "asc" }],
        select: {
          id: true,
          fecha: true,
          inicioMin: true,
          estado: true,
          especialidad: true,
          medico: { select: { firstName: true, lastName: true } },
        },
      },
    },
  });

  if (!paciente) throw new ApiError(404, "Paciente no encontrado");

  return {
    paciente: {
      id: paciente.id,
      nombreCompleto: nombreCompleto(paciente),
      dni: paciente.dni,
      cobertura: paciente.cobertura?.nombre ?? (paciente.esParticular ? "Particular" : null),
      numeroAfiliado: paciente.numeroAfiliado,
    },
    consultas: paciente.turnosComoPaciente.map((turno) => ({
      id: turno.id,
      fecha: aFechaISO(turno.fecha),
      hora: hora(turno.inicioMin),
      profesional: turno.medico ? nombreCompleto(turno.medico) : "Sin profesional",
      especialidad: especialidadFromEnum(turno.especialidad),
      estado: turno.estado === "ATENDIDO" ? "Atendido" : "Reservado",
      estadoCobro: "PENDIENTE DE PAGO" as const,
    })),
  };
}

export async function registrarPagoPresencial(datos: {
  turnoId: string;
  pacienteId: string;
  importe: number;
  medioPago: MedioPagoLabel;
  registradoPorId: string;
}) {
  if (!Number.isFinite(datos.importe) || datos.importe < 0) {
    throw new ApiError(400, "El importe debe ser numérico y mayor o igual a 0");
  }
  if (!MEDIOS_PAGO.includes(datos.medioPago)) {
    throw new ApiError(400, "El medio de pago seleccionado no es válido");
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const actualizado = await tx.turno.updateMany({
        where: {
          id: datos.turnoId,
          pacienteId: datos.pacienteId,
          tipo: "CONSULTA",
          estado: { in: ["RESERVADO", "ATENDIDO"] },
          estadoCobro: "PENDIENTE_DE_PAGO",
        },
        data: { estadoCobro: "PAGADO" },
      });

      if (actualizado.count !== 1) {
        throw new ApiError(409, "La consulta no existe, no está pendiente de pago o ya fue abonada");
      }

      const pago = await tx.pago.create({
        data: {
          turnoId: datos.turnoId,
          pacienteId: datos.pacienteId,
          registradoPorId: datos.registradoPorId,
          importe: datos.importe,
          medioPago: MEDIO_PAGO_ENUM[datos.medioPago],
        },
        select: { id: true, numeroComprobante: true, createdAt: true },
      });

      return {
        id: pago.id,
        numeroComprobante: pago.numeroComprobante,
        createdAt: pago.createdAt,
      };
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      throw new ApiError(409, "La consulta ya fue abonada");
    }
    throw error;
  }
}

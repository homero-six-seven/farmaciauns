/**
 * Servicio de "Turnos de vacunación" (Sprint 3: US-33, US-34, US-35 y US-60)
 * sobre Prisma/Neon, con el mismo patrón que `turno-service.ts` y
 * `stock-service.ts`: las reglas puras viven en `lib/domain/vacunacion.ts` y
 * los errores de negocio se lanzan como `ApiError`.
 *
 * Invariante de stock (consistente con US-44): reservar, cancelar y marcar
 * ausente mueven `Vacuna.stockActual` pero NO crean filas de
 * `MovimientoStock`; el reporte de stock cuenta los turnos por separado.
 */

import type { FechaISO } from "./domain/agenda";
import {
  MSG_PACIENTE_YA_TIENE_TURNO,
  MSG_TURNO_NO_CANCELABLE,
  MSG_TURNO_NO_CERRABLE,
  MSG_TURNO_NO_DISPONIBLE,
  MSG_TURNO_NO_ENCONTRADO,
  claveSlot,
  esFuturo,
  seSuperponen,
  type EstadoTurno,
  type Horario,
} from "./domain/turno";
import { MSG_VACUNA_NO_ENCONTRADA } from "./domain/vacuna";
import {
  MSG_PACIENTE_NO_ENCONTRADO,
  MSG_SIN_STOCK,
  esFechaISO,
  grillaVacunacion,
  horariosVacunacionLibres,
  motivoTurnoVacunacionNoCancelable,
  puedeRegistrarAplicacionOAusencia,
} from "./domain/vacunacion";
import { ApiError } from "./api";
import { aFechaDb, aFechaISO } from "./fecha-db";
import { getPrisma } from "./prisma";
import { getUserRepository } from "./repository";
import { columnaUnicaViolada, nombreCompleto } from "./turno-service";

/** Turno de vacunación tal como lo ve la enfermera en la lista del día (US-34). */
export interface TurnoVacunacionDeDia {
  id: string;
  fecha: FechaISO;
  inicioMin: number;
  finMin: number;
  estado: EstadoTurno;
  paciente: { nombreCompleto: string; dni: string | null };
  vacuna: string;
}

/** Paciente activo candidato para la asignación de un turno (US-33). */
export interface PacienteActivo {
  id: string;
  nombreCompleto: string;
  dni: string | null;
}

/**
 * Turnos de vacunación de un día, ordenados por hora (US-34 CA1). Incluye
 * todos los estados: Reservado, Atendido, Ausente y Cancelado.
 */
export async function listarTurnosVacunacion(
  fecha: FechaISO,
): Promise<TurnoVacunacionDeDia[]> {
  const filas = await getPrisma().turno.findMany({
    where: { tipo: "VACUNACION", fecha: aFechaDb(fecha) },
    orderBy: { inicioMin: "asc" },
    select: {
      id: true,
      estado: true,
      inicioMin: true,
      finMin: true,
      paciente: { select: { firstName: true, lastName: true, dni: true } },
      vacuna: { select: { nombre: true } },
    },
  });

  return filas.map((f) => ({
    id: f.id,
    fecha,
    inicioMin: f.inicioMin,
    finMin: f.finMin,
    estado: f.estado,
    paciente: {
      nombreCompleto: nombreCompleto(f.paciente),
      dni: f.paciente.dni,
    },
    vacuna: f.vacuna?.nombre ?? "—",
  }));
}

// ---------------------------------------------------------------------------
// US-33 — Búsqueda de pacientes activos
// ---------------------------------------------------------------------------

/**
 * Pacientes activos que coinciden con `q` por nombre, apellido o DNI.
 * Reutiliza la búsqueda de US-12 y filtra solo los activos (CA de US-33).
 */
export async function buscarPacientesActivos(q: string): Promise<PacienteActivo[]> {
  if (!q.trim()) {
    return [];
  }
  const resultados = await getUserRepository().searchByNameOrDni(q);
  return resultados
    .filter((u) => u.active)
    .map((u) => ({
      id: u.id,
      nombreCompleto: nombreCompleto({ firstName: u.firstName ?? null, lastName: u.lastName ?? null }),
      dni: u.dni ?? null,
    }));
}

/** El paciente activo con ese id, o `null` (US-33: solo pacientes activos). */
export async function obtenerPacienteActivo(id: string): Promise<PacienteActivo | null> {
  const usuario = await getUserRepository().findById(id);
  if (!usuario || !usuario.active || usuario.role !== "PACIENTE") {
    return null;
  }
  return {
    id: usuario.id,
    nombreCompleto: nombreCompleto({
      firstName: usuario.firstName ?? null,
      lastName: usuario.lastName ?? null,
    }),
    dni: usuario.dni ?? null,
  };
}

// ---------------------------------------------------------------------------
// US-33 — Disponibilidad de horarios
// ---------------------------------------------------------------------------

/**
 * Horarios libres y ocupados de vacunación de un día. Los libres salen de la
 * grilla de 15 minutos (lun–vie 08:00–18:00) menos los turnos no cancelados y
 * menos los que ya empezaron.
 */
export async function disponibilidadVacunacion(
  fecha: FechaISO,
  ahora: Date,
): Promise<{ libres: Horario[]; ocupados: Horario[] }> {
  const ocupados = (
    await getPrisma().turno.findMany({
      where: { tipo: "VACUNACION", estado: { not: "CANCELADO" }, fecha: aFechaDb(fecha) },
      select: { inicioMin: true, finMin: true },
    })
  ).map((t) => ({ fecha, inicioMin: t.inicioMin, finMin: t.finMin }));

  return {
    libres: horariosVacunacionLibres(fecha, ocupados, ahora),
    ocupados,
  };
}

// ---------------------------------------------------------------------------
// US-33 — Reservar turno de vacunación
// ---------------------------------------------------------------------------

/**
 * Asigna un turno de vacunación (US-33). En una transacción vuelve a comprobar
 * que la vacuna exista, que el horario esté en la grilla, sea futuro y no esté
 * ocupado, que el paciente sea activo y no tenga otro turno que se superponga,
 * descuenta 1 unidad del stock y crea el turno. Las columnas únicas
 * `slotMedico` (clave global del vacunatorio) y `slotPaciente` hacen fallar
 * las reservas concurrentes (CA3 y CA4).
 */
export async function reservarTurnoVacunacion(
  datos: { pacienteId: string; vacunaId: string; fecha: FechaISO; inicioMin: number },
  ahora: Date,
): Promise<{ id: string }> {
  const { pacienteId, vacunaId, fecha, inicioMin } = datos;
  if (!esFechaISO(fecha) || !Number.isInteger(inicioMin)) {
    throw new ApiError(422, MSG_TURNO_NO_DISPONIBLE);
  }
  const horario = grillaVacunacion(fecha).find((h) => h.inicioMin === inicioMin);
  if (!horario || !esFuturo(horario, ahora)) {
    throw new ApiError(409, MSG_TURNO_NO_DISPONIBLE);
  }

  try {
    return await getPrisma().$transaction(async (tx) => {
      const vacuna = await tx.vacuna.findUnique({
        where: { id: vacunaId },
        select: { id: true },
      });
      if (!vacuna) {
        throw new ApiError(404, MSG_VACUNA_NO_ENCONTRADA);
      }

      const paciente = await tx.user.findFirst({
        where: { id: pacienteId, role: "PACIENTE", isActive: true },
        select: { id: true },
      });
      if (!paciente) {
        throw new ApiError(404, MSG_PACIENTE_NO_ENCONTRADO);
      }

      // Horario global del vacunatorio libre (CA3).
      const ocupados = await tx.turno.findMany({
        where: { tipo: "VACUNACION", estado: { not: "CANCELADO" }, fecha: aFechaDb(fecha) },
        select: { inicioMin: true, finMin: true },
      });
      if (ocupados.some((t) => seSuperponen(horario, { fecha, inicioMin: t.inicioMin, finMin: t.finMin }))) {
        throw new ApiError(409, MSG_TURNO_NO_DISPONIBLE);
      }

      // El paciente no puede tener otro turno en esa fecha y hora (CA4).
      const delPaciente = await tx.turno.findMany({
        where: { pacienteId, estado: { not: "CANCELADO" }, fecha: aFechaDb(fecha) },
        select: { inicioMin: true, finMin: true },
      });
      if (delPaciente.some((t) => seSuperponen(horario, { fecha, inicioMin: t.inicioMin, finMin: t.finMin }))) {
        throw new ApiError(409, MSG_PACIENTE_YA_TIENE_TURNO);
      }

      // Descuenta la dosis; si no hay stock, no asigna (CA2).
      const stock = await tx.vacuna.updateMany({
        where: { id: vacunaId, stockActual: { gt: 0 } },
        data: { stockActual: { decrement: 1 } },
      });
      if (stock.count === 0) {
        throw new ApiError(409, MSG_SIN_STOCK);
      }

      return tx.turno.create({
        data: {
          tipo: "VACUNACION",
          estado: "RESERVADO",
          pacienteId,
          vacunaId,
          fecha: aFechaDb(fecha),
          inicioMin,
          finMin: horario.finMin,
          // Clave global del vacunatorio: un solo turno por slot (CA3).
          slotMedico: claveSlot("VACUNACION", fecha, inicioMin),
          slotPaciente: claveSlot(pacienteId, fecha, inicioMin),
        },
        select: { id: true },
      });
    });
  } catch (error) {
    const columna = columnaUnicaViolada(error);
    if (columna === "slotPaciente") throw new ApiError(409, MSG_PACIENTE_YA_TIENE_TURNO);
    if (columna !== null) throw new ApiError(409, MSG_TURNO_NO_DISPONIBLE);
    throw error;
  }
}

// ---------------------------------------------------------------------------
// US-35 y US-60 — Cierre de turnos de vacunación
// ---------------------------------------------------------------------------

/**
 * Cancela un turno de vacunación futuro (US-35): pasa a "Cancelado", libera el
 * horario y devuelve la dosis al stock SIN tope de 50 (CA4).
 */
export async function cancelarTurnoVacunacion(turnoId: string, ahora: Date): Promise<void> {
  const prisma = getPrisma();
  const turno = await prisma.turno.findFirst({
    where: { id: turnoId, tipo: "VACUNACION" },
    select: { estado: true, fecha: true, inicioMin: true, vacunaId: true },
  });
  if (!turno) {
    throw new ApiError(404, MSG_TURNO_NO_ENCONTRADO);
  }
  const motivo = motivoTurnoVacunacionNoCancelable(
    { tipo: "VACUNACION", estado: turno.estado, fecha: aFechaISO(turno.fecha), inicioMin: turno.inicioMin },
    ahora,
  );
  if (motivo) {
    throw new ApiError(409, motivo);
  }

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.turno.updateMany({
      where: { id: turnoId, estado: "RESERVADO" },
      data: { estado: "CANCELADO", slotMedico: null, slotPaciente: null },
    });
    if (resultado.count === 0) {
      throw new ApiError(409, MSG_TURNO_NO_CANCELABLE);
    }
    if (turno.vacunaId) {
      await tx.vacuna.update({
        where: { id: turno.vacunaId },
        data: { stockActual: { increment: 1 } },
      });
    }
  });
}

/**
 * Registra la aplicación de la vacuna (US-60 CA1): pasa el turno a "Atendido"
 * sin tocar el stock (la dosis ya se descontó al reservar).
 */
export async function marcarVacunaAplicada(turnoId: string, hoy: FechaISO): Promise<void> {
  await cerrarTurnoVacunacion(turnoId, hoy, { devolverDosis: false });
}

/**
 * Registra la ausencia del paciente (US-60 CA2): pasa el turno a "Ausente" y
 * devuelve la dosis al stock SIN tope de 50 (misma regla que US-35).
 */
export async function marcarAusenteVacunacion(turnoId: string, hoy: FechaISO): Promise<void> {
  await cerrarTurnoVacunacion(turnoId, hoy, { devolverDosis: true });
}

/** Cierre compartido de US-60: solo turnos reservados de hoy o días anteriores. */
async function cerrarTurnoVacunacion(
  turnoId: string,
  hoy: FechaISO,
  { devolverDosis }: { devolverDosis: boolean },
): Promise<void> {
  const prisma = getPrisma();
  const turno = await prisma.turno.findFirst({
    where: { id: turnoId, tipo: "VACUNACION" },
    select: { estado: true, fecha: true, vacunaId: true },
  });
  if (!turno) {
    throw new ApiError(404, MSG_TURNO_NO_ENCONTRADO);
  }
  if (
    !puedeRegistrarAplicacionOAusencia(
      { tipo: "VACUNACION", estado: turno.estado, fecha: aFechaISO(turno.fecha) },
      hoy,
    )
  ) {
    throw new ApiError(409, MSG_TURNO_NO_CERRABLE);
  }

  await prisma.$transaction(async (tx) => {
    const resultado = await tx.turno.updateMany({
      where: { id: turnoId, estado: "RESERVADO" },
      data: { estado: devolverDosis ? "AUSENTE" : "ATENDIDO" },
    });
    if (resultado.count === 0) {
      throw new ApiError(409, MSG_TURNO_NO_CERRABLE);
    }
    if (devolverDosis && turno.vacunaId) {
      await tx.vacuna.update({
        where: { id: turno.vacunaId },
        data: { stockActual: { increment: 1 } },
      });
    }
  });
}

/** Un turno de vacunación por id (para la pantalla de éxito de US-33). */
export async function obtenerTurnoVacunacionPorId(
  turnoId: string,
): Promise<TurnoVacunacionDeDia | null> {
  const fila = await getPrisma().turno.findFirst({
    where: { id: turnoId, tipo: "VACUNACION" },
    select: {
      id: true,
      estado: true,
      fecha: true,
      inicioMin: true,
      finMin: true,
      paciente: { select: { firstName: true, lastName: true, dni: true } },
      vacuna: { select: { nombre: true } },
    },
  });
  if (!fila) {
    return null;
  }
  return {
    id: fila.id,
    fecha: aFechaISO(fila.fecha),
    inicioMin: fila.inicioMin,
    finMin: fila.finMin,
    estado: fila.estado,
    paciente: {
      nombreCompleto: nombreCompleto(fila.paciente),
      dni: fila.paciente.dni,
    },
    vacuna: fila.vacuna?.nombre ?? "—",
  };
}

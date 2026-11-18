/**
 * Servicio de "Turnos de vacunación" (Sprint 3: US-33, US-34, US-35 y US-60)
 * sobre Prisma/Neon, con el mismo patrón que `turno-service.ts` y
 * `stock-service.ts`: las reglas puras viven en `lib/domain/vacunacion.ts` y
 * los errores de negocio se lanzan como `ApiError`.
 *
 * Los ids de paciente los recibe siempre de la sesión (`requireRole` de la
 * enfermera), nunca del formulario.
 */

import type { FechaISO } from "./domain/agenda";
import type { EstadoTurno } from "./domain/turno";
import { aFechaDb } from "./fecha-db";
import { getPrisma } from "./prisma";
import { nombreCompleto } from "./turno-service";

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

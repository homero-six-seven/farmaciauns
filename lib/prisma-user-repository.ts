/**
 * Implementación persistente de `UserRepository` sobre Prisma/Neon.
 *
 * Delega el acceso a datos en `getPrisma()` (singleton lazy con `PrismaNeon`,
 * ver `lib/prisma.ts`). Es stateless: no cachea usuarios, la factory de
 * `lib/repository.ts` cachea la instancia del repo en `globalThis`.
 *
 * El MAPEO entre el dominio `Usuario` y el modelo `User` de Neon vive SOLO acá:
 * - `isActive` (DB, Boolean) ↔ `active` (dominio, boolean).
 * - `especialidad` (DB, enum `Especialidad`) ↔ `especialidad` (dominio, string
 *   con acentos: "Clínica médica", "Pediatría", "Traumatología").
 * - `email` (DB, NOT NULL + @unique case-sensitive) se normaliza
 *   `lowercase().trim()` en write.
 * - `birthDate` / `passwordHash` mapean directo (nullable ↔ nullable).
 * - `role` es estructuralmente idéntico (mismo literal union) → sin cast.
 */

import { $Enums } from "@/generated/prisma/client";
import type { Prisma, User } from "@/generated/prisma/client";
import type { Role, Usuario } from "./domain/usuario";
import { normalizarDni } from "./domain/usuario";
import { getPrisma } from "./prisma";
import type { NuevoUsuarioInput, UserRepository } from "./repository";

// ---------------------------------------------------------------------------
// Helpers de mapeo enum <-> string (especialidad)
// ---------------------------------------------------------------------------

/** Mapa enum de DB → string legible del dominio. */
const ESPECIALIDAD_POR_ENUM: Record<$Enums.Especialidad, string> = {
  CLINICA_MEDICA: "Clínica médica",
  PEDIATRIA: "Pediatría",
  TRAUMATOLOGIA: "Traumatología",
};

/** Mapa inverso: string del dominio → enum de DB. */
const ENUM_POR_ESPECIALIDAD: Record<string, $Enums.Especialidad> = {
  "Clínica médica": "CLINICA_MEDICA",
  Pediatría: "PEDIATRIA",
  Traumatología: "TRAUMATOLOGIA",
};

/**
 * Convierte el string de dominio (`especialidad`) al enum de Prisma.
 * Devuelve `null` para valores vacíos o fuera del mapa (guard defensivo;
 * la capa de validación ya restringe a `ESPECIALIDADES`).
 */
export function especialidadToEnum(
  especialidad: string | null | undefined,
): $Enums.Especialidad | null {
  const e = especialidad?.trim();
  if (!e) {
    return null;
  }
  return ENUM_POR_ESPECIALIDAD[e] ?? null;
}

/**
 * Convierte el enum de Prisma (`especialidad`) al string de dominio.
 * Devuelve `null` para `null`/`undefined` o un enum desconocido.
 */
export function especialidadFromEnum(
  especialidad: $Enums.Especialidad | null | undefined,
): string | null {
  if (!especialidad) {
    return null;
  }
  return ESPECIALIDAD_POR_ENUM[especialidad] ?? null;
}

// ---------------------------------------------------------------------------
// Mapeadores fila <-> dominio
// ---------------------------------------------------------------------------

/**
 * Mapea una fila del modelo `User` de Prisma al dominio `Usuario`.
 *
 * - `isActive` → `active`.
 * - `especialidad` (enum) → string legible.
 * - `role` es estructuralmente idéntico al `Role` del dominio (mismo literal
 *   union), por lo que no requiere cast.
 */
export function toUsuario(row: User): Usuario {
  return {
    id: row.id,
    clerkId: row.clerkId,
    email: row.email,
    firstName: row.firstName,
    lastName: row.lastName,
    dni: row.dni,
    phone: row.phone,
    birthDate: row.birthDate,
    especialidad: especialidadFromEnum(row.especialidad),
    matricula: row.matricula,
    passwordHash: row.passwordHash,
    role: row.role,
    active: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * Convierte el input de creación en los datos que espera `prisma.user.create`.
 *
 * Normalización de write:
 * - `dni` → `normalizarDni` (quita puntos/espacios/guiones).
 * - `email` → `lowercase().trim()` (Postgres `@unique` es case-sensitive).
 *   La columna es NOT NULL; el dominio garantiza un email presente y válido
 *   (validado en `actions.ts`), así que `?? ""` solo cubre el tipo opcional.
 * - `especialidad` → enum vía `especialidadToEnum` (o `null`).
 * - `active` (dominio) → `isActive` (DB).
 * - `clerkId` → `null` (Clerk no está cableado todavía).
 * - Los opcionales quedan en `null` cuando son vacíos/ausentes.
 */
export function toUserCreateData(
  input: NuevoUsuarioInput,
): Prisma.UserCreateInput {
  return {
    clerkId: null,
    email: input.email?.trim().toLowerCase() ?? "",
    firstName: input.firstName.trim() || null,
    lastName: input.lastName.trim() || null,
    dni: input.dni ? normalizarDni(input.dni) : null,
    phone: input.phone?.trim() || null,
    birthDate: input.birthDate ?? null,
    especialidad: especialidadToEnum(input.especialidad),
    matricula: input.matricula?.trim() || null,
    passwordHash: input.passwordHash ?? null,
    role: input.role,
    isActive: input.active ?? true,
  };
}

export class PrismaUserRepository implements UserRepository {
  async create(input: NuevoUsuarioInput): Promise<Usuario> {
    const row = await getPrisma().user.create({
      data: toUserCreateData(input),
    });
    return toUsuario(row);
  }

  async findById(id: string): Promise<Usuario | undefined> {
    const row = await getPrisma().user.findUnique({ where: { id } });
    return row ? toUsuario(row) : undefined;
  }

  async findByDni(dni: string): Promise<Usuario | undefined> {
    const normalizado = normalizarDni(dni);
    if (!normalizado) {
      return undefined;
    }
    const row = await getPrisma().user.findUnique({
      where: { dni: normalizado },
    });
    return row ? toUsuario(row) : undefined;
  }

  async findByEmail(email: string): Promise<Usuario | undefined> {
    const normalizado = email.trim().toLowerCase();
    if (!normalizado) {
      return undefined;
    }
    const row = await getPrisma().user.findUnique({
      where: { email: normalizado },
    });
    return row ? toUsuario(row) : undefined;
  }

  async listByRole(role: Role): Promise<Usuario[]> {
    const rows = await getPrisma().user.findMany({
      where: { role },
      orderBy: { lastName: "asc" },
    });
    return rows.map(toUsuario);
  }

  async searchByNameOrDni(query: string): Promise<Usuario[]> {
    const q = query.trim().toLowerCase();
    if (!q) {
      return [];
    }
    const dni = normalizarDni(query);
    const rows = await getPrisma().user.findMany({
      where: {
        role: "PACIENTE",
        OR: [
          { firstName: { contains: q, mode: "insensitive" } },
          { lastName: { contains: q, mode: "insensitive" } },
          { dni: { contains: dni } },
        ],
      },
      orderBy: { lastName: "asc" },
    });
    return rows.map(toUsuario);
  }

  async deactivate(id: string): Promise<void> {
    // `updateMany` tolera ids inexistentes (no lanza P2025, no-op silencioso);
    // `update` lanzaría P2025 ante un POST directo con un id inválido.
    await getPrisma().user.updateMany({
      where: { id },
      data: { isActive: false },
    });
  }
}

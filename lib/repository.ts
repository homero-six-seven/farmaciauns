/**
 * Capa de acceso a datos de usuarios.
 *
 * Define la interfaz `UserRepository` (async) con dos implementaciones:
 * - `PrismaUserRepository` (`lib/prisma-user-repository.ts`) → persistente
 *   contra Neon/PostgreSQL, elegida cuando `DATABASE_URL` está seteada.
 * - `InMemoryUserRepository` → fallback en memoria (demos sin DB).
 */

import { randomUUID } from "node:crypto";
import type { Role, Usuario } from "./domain/usuario";
import { normalizarDni } from "./domain/usuario";
import { PrismaUserRepository } from "./prisma-user-repository";

/** Datos necesarios para crear un usuario. */
export interface NuevoUsuarioInput {
  firstName: string;
  lastName: string;
  dni?: string;
  email?: string;
  phone?: string;
  birthDate?: Date;
  especialidad?: string;
  matricula?: string;
  passwordHash?: string;
  role: Role;
  active?: boolean;
}

export interface UserRepository {
  create(input: NuevoUsuarioInput): Promise<Usuario>;
  findById(id: string): Promise<Usuario | undefined>;
  findByDni(dni: string): Promise<Usuario | undefined>;
  findByEmail(email: string): Promise<Usuario | undefined>;
  listByRole(role: Role): Promise<Usuario[]>;
  /** Busca PACIENTES por nombre, apellido o DNI (case-insensitive). */
  searchByNameOrDni(query: string): Promise<Usuario[]>;
  /** Soft delete: marca al usuario como inactivo (`active=false`). No borra la fila. */
  deactivate(id: string): Promise<void>;
}

/** Implementación en memoria. El array vive en el singleton de `getUserRepository`. */
export class InMemoryUserRepository implements UserRepository {
  private readonly usuarios: Usuario[] = [];

  constructor(semilla: Usuario[] = []) {
    this.usuarios = semilla.map((u) => ({ ...u }));
  }

  async create(input: NuevoUsuarioInput): Promise<Usuario> {
    const ahora = new Date();
    const usuario: Usuario = {
      id: randomUUID(),
      clerkId: null,
      email: input.email?.trim() || null,
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      dni: input.dni ? normalizarDni(input.dni) : null,
      phone: input.phone?.trim() || null,
      birthDate: input.birthDate ?? null,
      especialidad: input.especialidad?.trim() || null,
      matricula: input.matricula?.trim() || null,
      passwordHash: input.passwordHash ?? null,
      role: input.role,
      active: input.active ?? true,
      createdAt: ahora,
      updatedAt: ahora,
    };
    this.usuarios.push(usuario);
    return usuario;
  }

  async findById(id: string): Promise<Usuario | undefined> {
    return this.usuarios.find((u) => u.id === id);
  }

  async findByDni(dni: string): Promise<Usuario | undefined> {
    const n = normalizarDni(dni);
    return this.usuarios.find((u) => u.dni === n);
  }

  async findByEmail(email: string): Promise<Usuario | undefined> {
    const e = email.trim().toLowerCase();
    return this.usuarios.find(
      (u) => u.email?.trim().toLowerCase() === e,
    );
  }

  async listByRole(role: Role): Promise<Usuario[]> {
    return this.usuarios
      .filter((u) => u.role === role)
      .slice()
      .sort((a, b) =>
        (a.lastName ?? "").localeCompare(b.lastName ?? "", "es"),
      );
  }

  async searchByNameOrDni(query: string): Promise<Usuario[]> {
    const q = query.trim().toLowerCase();
    if (q === "") {
      return [];
    }
    const dniNormalizado = normalizarDni(query);
    return this.usuarios
      .filter((u) => u.role === "PACIENTE")
      .filter((u) => {
        const nombre = `${u.firstName ?? ""} ${u.lastName ?? ""}`
          .toLowerCase();
        return (
          nombre.includes(q) ||
          (u.lastName ?? "").toLowerCase().includes(q) ||
          (u.firstName ?? "").toLowerCase().includes(q) ||
          (u.dni ?? "").includes(dniNormalizado)
        );
      })
      .slice()
      .sort((a, b) =>
        (a.lastName ?? "").localeCompare(b.lastName ?? "", "es"),
      );
  }

  async deactivate(id: string): Promise<void> {
    const usuario = this.usuarios.find((u) => u.id === id);
    if (usuario) {
      usuario.active = false;
    }
  }
}

// ---------------------------------------------------------------------------
// Semilla: pacientes de demostración para US-12 (búsqueda de pacientes).
// NO se siembra personal administrativo a propósito: así US-13 arranca en su
// estado vacío ("No hay personal administrativo registrado") y el flujo
// US-07 → US-08 → US-13 se demuestra de punta a punta.
// ---------------------------------------------------------------------------

function fecha(anio: number, mes: number, dia: number): Date {
  return new Date(anio, mes - 1, dia);
}

export const pacientesSemilla: Usuario[] = [
  {
    id: "pac-gomez-maria",
    clerkId: null,
    email: "mgomez@email.com",
    firstName: "María",
    lastName: "Gómez",
    dni: "32841902",
    phone: "+54 11 4789-3321",
    birthDate: fecha(1987, 8, 14),
    passwordHash: null,
    role: "PACIENTE",
    active: true,
    createdAt: new Date("2026-01-10T09:00:00Z"),
    updatedAt: new Date("2026-01-10T09:00:00Z"),
  },
  {
    id: "pac-gomez-carlos",
    clerkId: null,
    email: "cgomez@email.com",
    firstName: "Carlos Alberto",
    lastName: "Gómez",
    dni: "28192405",
    phone: "+54 11 4221-8890",
    birthDate: fecha(1980, 11, 3),
    passwordHash: null,
    role: "PACIENTE",
    active: true,
    createdAt: new Date("2026-01-11T09:00:00Z"),
    updatedAt: new Date("2026-01-11T09:00:00Z"),
  },
  {
    id: "pac-gomez-lucia",
    clerkId: null,
    email: "lucia.gomez@email.com",
    firstName: "Lucía Elena",
    lastName: "Gómez",
    dni: "39512780",
    phone: "+54 11 6512-4412",
    birthDate: fecha(1996, 4, 22),
    passwordHash: null,
    role: "PACIENTE",
    active: false,
    createdAt: new Date("2026-01-12T09:00:00Z"),
    updatedAt: new Date("2026-01-12T09:00:00Z"),
  },
  {
    id: "pac-gomez-valeria",
    clerkId: null,
    email: "vgomez@email.com",
    firstName: "Valeria",
    lastName: "Gómez",
    dni: "36204811",
    phone: "+54 11 5890-1123",
    birthDate: fecha(1991, 9, 19),
    passwordHash: null,
    role: "PACIENTE",
    active: true,
    createdAt: new Date("2026-01-13T09:00:00Z"),
    updatedAt: new Date("2026-01-13T09:00:00Z"),
  },
  {
    id: "pac-perez-juan",
    clerkId: null,
    email: "jperez@email.com",
    firstName: "Juan",
    lastName: "Pérez",
    dni: "30123456",
    phone: "+54 11 4000-7788",
    birthDate: fecha(1975, 2, 9),
    passwordHash: null,
    role: "PACIENTE",
    active: true,
    createdAt: new Date("2026-01-14T09:00:00Z"),
    updatedAt: new Date("2026-01-14T09:00:00Z"),
  },
];

// ---------------------------------------------------------------------------
// Semilla: médicos y enfermeras (US-10 y US-14).
// Los médicos cubren las 3 especialidades + 1 inactivo (para demo del filtro
// de estado). Las enfermeras son 3 activas, sin especialidad (`null`).
// ---------------------------------------------------------------------------

export const medicosSemilla: Usuario[] = [
  {
    id: "med-fernandez-ana",
    clerkId: null,
    email: "afernandez@farmaciauns.org.ar",
    firstName: "Ana",
    lastName: "Fernández",
    dni: "29567123",
    phone: "+54 11 4622-1098",
    birthDate: null,
    especialidad: "Clínica médica",
    passwordHash: null,
    role: "MEDICO",
    active: false,
    createdAt: new Date("2026-02-01T09:00:00Z"),
    updatedAt: new Date("2026-02-01T09:00:00Z"),
  },
  {
    id: "med-gomez-carlos",
    clerkId: null,
    email: "cgomez@farmaciauns.org.ar",
    firstName: "Carlos",
    lastName: "Gómez",
    dni: "27124567",
    phone: "+54 11 4331-2287",
    birthDate: null,
    especialidad: "Traumatología",
    passwordHash: null,
    role: "MEDICO",
    active: true,
    createdAt: new Date("2026-02-02T09:00:00Z"),
    updatedAt: new Date("2026-02-02T09:00:00Z"),
  },
  {
    id: "med-perez-juan",
    clerkId: null,
    email: "jperez@farmaciauns.org.ar",
    firstName: "Juan",
    lastName: "Pérez",
    dni: "30156789",
    phone: "+54 11 4890-3321",
    birthDate: null,
    especialidad: "Clínica médica",
    passwordHash: null,
    role: "MEDICO",
    active: true,
    createdAt: new Date("2026-02-03T09:00:00Z"),
    updatedAt: new Date("2026-02-03T09:00:00Z"),
  },
  {
    id: "med-rodriguez-maria",
    clerkId: null,
    email: "mrodriguez@farmaciauns.org.ar",
    firstName: "María",
    lastName: "Rodríguez",
    dni: "33215478",
    phone: "+54 11 4711-5566",
    birthDate: null,
    especialidad: "Pediatría",
    passwordHash: null,
    role: "MEDICO",
    active: true,
    createdAt: new Date("2026-02-04T09:00:00Z"),
    updatedAt: new Date("2026-02-04T09:00:00Z"),
  },
];

export const enfermerasSemilla: Usuario[] = [
  {
    id: "enf-martinez-laura",
    clerkId: null,
    email: "lmartinez@farmaciauns.org.ar",
    firstName: "Laura",
    lastName: "Martínez",
    dni: "34123678",
    phone: "+54 11 4555-0011",
    birthDate: null,
    especialidad: null,
    passwordHash: null,
    role: "ENFERMERA",
    active: true,
    createdAt: new Date("2026-02-05T09:00:00Z"),
    updatedAt: new Date("2026-02-05T09:00:00Z"),
  },
  {
    id: "enf-rios-patricia",
    clerkId: null,
    email: "prios@farmaciauns.org.ar",
    firstName: "Patricia",
    lastName: "Ríos",
    dni: "35874210",
    phone: "+54 11 4666-7788",
    birthDate: null,
    especialidad: null,
    passwordHash: null,
    role: "ENFERMERA",
    active: true,
    createdAt: new Date("2026-02-06T09:00:00Z"),
    updatedAt: new Date("2026-02-06T09:00:00Z"),
  },
  {
    id: "enf-sosa-diego",
    clerkId: null,
    email: "dsosa@farmaciauns.org.ar",
    firstName: "Diego",
    lastName: "Sosa",
    dni: "31549832",
    phone: "+54 11 4777-9900",
    birthDate: null,
    especialidad: null,
    passwordHash: null,
    role: "ENFERMERA",
    active: true,
    createdAt: new Date("2026-02-07T09:00:00Z"),
    updatedAt: new Date("2026-02-07T09:00:00Z"),
  },
];

// ---------------------------------------------------------------------------
// Factory + singleton
// ---------------------------------------------------------------------------

const globalForRepo = globalThis as typeof globalThis & {
  __farmaciaunsUserRepository?: UserRepository;
};

/**
 * Devuelve el repositorio de usuarios (singleton).
 *
 * Usa `globalThis` (mismo patrón que `lib/prisma.ts`) para que la MISMA
 * instancia se comparta entre server components y server actions dentro de
 * un mismo proceso.
 *
 * - Con `DATABASE_URL` seteada → `PrismaUserRepository` (persistente, Neon).
 * - Sin `DATABASE_URL` → `InMemoryUserRepository` con la semilla demo.
 */
export function getUserRepository(): UserRepository {
  if (!globalForRepo.__farmaciaunsUserRepository) {
    globalForRepo.__farmaciaunsUserRepository = process.env.DATABASE_URL?.trim()
      ? new PrismaUserRepository()
      : new InMemoryUserRepository([
          ...pacientesSemilla,
          ...medicosSemilla,
          ...enfermerasSemilla,
        ]);
  }
  return globalForRepo.__farmaciaunsUserRepository;
}

/**
 * Seed idempotente de datos demo (pacientes, médicos y enfermeras).
 *
 * Se ejecuta vía `pnpm exec prisma db seed` (ver `prisma.seed` en
 * `package.json`). Hace `upsert` por `dni` (clave `@unique`), así que correrlo
 * N veces NO duplica registros. Reutiliza la misma semilla que el fallback
 * `InMemoryUserRepository` para que las demos US-12/10/14 se vean igual con y
 * sin base de datos.
 */

import { loadEnvConfig } from "@next/env";
import type { Usuario } from "../lib/domain/usuario";
import { toUserCreateData } from "../lib/prisma-user-repository";
import { getPrisma } from "../lib/prisma";
import {
  enfermerasSemilla,
  medicosSemilla,
  pacientesSemilla,
} from "../lib/repository";
import type { NuevoUsuarioInput } from "../lib/repository";

// Carga `DATABASE_URL` desde `.env` antes de instanciar Prisma.
loadEnvConfig(process.cwd());

/** Adapta un `Usuario` de dominio al input de creación del repositorio. */
function toInput(u: Usuario): NuevoUsuarioInput {
  return {
    firstName: u.firstName ?? "",
    lastName: u.lastName ?? "",
    dni: u.dni ?? undefined,
    email: u.email ?? undefined,
    phone: u.phone ?? undefined,
    birthDate: u.birthDate ?? undefined,
    especialidad: u.especialidad ?? undefined,
    matricula: u.matricula ?? undefined,
    passwordHash: u.passwordHash ?? undefined,
    role: u.role,
    active: u.active,
  };
}

async function seed(): Promise<void> {
  const prisma = getPrisma();
  const demo = [...pacientesSemilla, ...medicosSemilla, ...enfermerasSemilla];

  for (const u of demo) {
    const data = toUserCreateData(toInput(u));
    if (!data.dni) {
      console.warn(
        `Seed: omitiendo "${u.firstName ?? ""} ${u.lastName ?? ""}" (sin DNI para upsert).`,
      );
      continue;
    }
    await prisma.user.upsert({
      where: { dni: data.dni },
      create: data,
      update: {},
    });
  }

  console.log(`Seed completado: ${demo.length} usuarios demo (idempotente).`);
}

seed()
  .then(() => {
    console.log("Seed finalizado.");
  })
  .catch((error) => {
    console.error("Error en seed:", error);
    process.exitCode = 1;
  });

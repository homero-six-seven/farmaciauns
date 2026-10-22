/**
 * Backfill de `Cobertura.nombreNormalizado` (defecto 07).
 *
 * El normalizador cambió: ahora elimina puntos y espacios ("O.S.D.E" y "OSDE"
 * → "osde"). Este script:
 *
 * 1. Recalcula la clave normalizada de cada cobertura existente.
 * 2. Deduplica: si dos o más filas normalizan igual, re-apunta los vínculos
 *    (MedicoCobertura) y los pacientes (User.coberturaId) hacia la fila
 *    "canónica" (la de nombre más limpio) y elimina las duplicadas.
 * 3. Actualiza `nombreNormalizado` de las filas que sobreviven.
 *
 * Es idempotente: correrlo dos veces no produce cambios.
 *
 * Ejecutar con: pnpm dlx tsx prisma/backfill-cobertura-normalizado.ts
 */

import { loadEnvConfig } from "@next/env";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";
import { normalizarNombreCobertura } from "../lib/domain/cobertura";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

type FilaCobertura = {
  id: string;
  nombre: string;
  nombreNormalizado: string;
  createdAt: Date;
};

function esNombreLimpio(fila: FilaCobertura): boolean {
  return fila.nombre.trim().toLowerCase() === fila.nombreNormalizado;
}

async function main() {
  const filas = await prisma.cobertura.findMany({
    select: { id: true, nombre: true, nombreNormalizado: true, createdAt: true },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });

  const grupos = new Map<string, FilaCobertura[]>();
  for (const f of filas) {
    const clave = normalizarNombreCobertura(f.nombre);
    const lista = grupos.get(clave) ?? [];
    lista.push(f);
    grupos.set(clave, lista);
  }

  let vinculadasRepuntadas = 0;
  let pacientesRepuntados = 0;
  let duplicadasEliminadas = 0;
  let clavesActualizadas = 0;

  for (const [clave, grupo] of grupos) {
    // La fila canónica es la de nombre "más limpio" (coincide con la clave
    // normalizada); empates por createdAt y luego id (orden ya aplicado).
    const ordenadas = [...grupo].sort(
      (a, b) =>
        Number(esNombreLimpio(b)) - Number(esNombreLimpio(a)),
    );
    const keeper = ordenadas[0];
    const duplicadas = ordenadas.slice(1);

    for (const dup of duplicadas) {
      const vinculos = await prisma.medicoCobertura.findMany({
        where: { coberturaId: dup.id },
        select: { id: true, medicoId: true },
      });
      for (const v of vinculos) {
        const ya = await prisma.medicoCobertura.findUnique({
          where: {
            medicoId_coberturaId: {
              medicoId: v.medicoId,
              coberturaId: keeper.id,
            },
          },
          select: { id: true },
        });
        if (ya) {
          await prisma.medicoCobertura.delete({ where: { id: v.id } });
        } else {
          await prisma.medicoCobertura.update({
            where: { id: v.id },
            data: { coberturaId: keeper.id },
          });
        }
        vinculadasRepuntadas++;
      }

      const pacientes = await prisma.user.updateMany({
        where: { coberturaId: dup.id },
        data: { coberturaId: keeper.id },
      });
      pacientesRepuntados += pacientes.count;

      await prisma.cobertura.delete({ where: { id: dup.id } });
      duplicadasEliminadas++;
    }

    if (keeper.nombreNormalizado !== clave) {
      await prisma.cobertura.update({
        where: { id: keeper.id },
        data: { nombreNormalizado: clave },
      });
      clavesActualizadas++;
    }
  }

  console.log("🧹 Backfill de coberturas completado:");
  console.log(`   - Duplicadas eliminadas: ${duplicadasEliminadas}`);
  console.log(`   - Vínculos médico↔cobertura re-apuntados: ${vinculadasRepuntadas}`);
  console.log(`   - Pacientes re-apuntados: ${pacientesRepuntados}`);
  console.log(`   - Claves normalizadas actualizadas: ${clavesActualizadas}`);

  const restantes = await prisma.cobertura.findMany({
    select: { nombre: true, nombreNormalizado: true },
    orderBy: { nombre: "asc" },
  });
  console.log("\n📋 Catálogo resultante:");
  for (const c of restantes) {
    console.log(`   - ${c.nombre} → ${c.nombreNormalizado}`);
  }
}

main()
  .catch((err) => {
    console.error("❌ Backfill failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { loadEnvConfig } from "@next/env";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/prisma/client";

loadEnvConfig(process.cwd());

const connectionString = process.env.DATABASE_URL?.trim();
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  console.log("🌱 Starting seed...");

  const enfermeras = [
    {
      firstName: "Silvina",
      lastName: "Acuña",
      dni: "33120455",
      email: "sacuna@salamedica.com",
      phone: "+54 11 4980-2211",
      role: "ENFERMERA" as const,
      isActive: true,
    },
    {
      firstName: "Mariana",
      lastName: "Benítez",
      dni: "35849201",
      email: "mbenitez@salamedica.com",
      phone: "+54 11 4980-2212",
      role: "ENFERMERA" as const,
      isActive: true,
    },
    {
      firstName: "Roberto",
      lastName: "Morales",
      dni: "28712940",
      email: "rmorales@salamedica.com",
      phone: "+54 11 4980-2213",
      role: "ENFERMERA" as const,
      isActive: true,
    },
    {
      firstName: "Claudia",
      lastName: "Vega",
      dni: "36902114",
      email: "cvega@salamedica.com",
      phone: "+54 11 4980-2214",
      role: "ENFERMERA" as const,
      isActive: true,
    },
    {
      firstName: "Karina",
      lastName: "López",
      dni: "30129845",
      email: "klopez@salamedica.com",
      phone: "+54 11 4980-2215",
      role: "ENFERMERA" as const,
      isActive: false,
    },
  ];

  for (const e of enfermeras) {
    await prisma.user.upsert({
      where: { email: e.email },
      update: e,
      create: e,
    });
  }
  console.log(`✅ Loaded ${enfermeras.length} enfermeras.`);

  const medicos = [
    {
      firstName: "Marcos",
      lastName: "Álvarez",
      dni: "34892110",
      email: "malvarez@salamedica.com",
      phone: "+54 11 4980-2210",
      matricula: "MN 149832",
      especialidad: "CLINICA_MEDICA" as const,
      role: "MEDICO" as const,
      isActive: true,
    },
    {
      firstName: "Silvina",
      lastName: "Benítez",
      dni: "32441908",
      email: "sbenitez@salamedica.com",
      phone: "+54 11 4980-2216",
      matricula: "MN 138761",
      especialidad: "PEDIATRIA" as const,
      role: "MEDICO" as const,
      isActive: true,
    },
    {
      firstName: "Leonardo",
      lastName: "Castro",
      dni: "29881023",
      email: "lcastro@salamedica.com",
      phone: "+54 11 4980-2217",
      matricula: "MN 119450",
      especialidad: "TRAUMATOLOGIA" as const,
      role: "MEDICO" as const,
      isActive: false,
    },
    {
      firstName: "Florencia",
      lastName: "Díaz",
      dni: "36112994",
      email: "fdiaz@salamedica.com",
      phone: "+54 11 4980-2218",
      matricula: "MN 158223",
      especialidad: "CLINICA_MEDICA" as const,
      role: "MEDICO" as const,
      isActive: true,
    },
    {
      firstName: "Matías",
      lastName: "Gómez",
      dni: "31092837",
      email: "mgomez@salamedica.com",
      phone: "+54 11 4980-2219",
      matricula: "MN 130491",
      especialidad: "PEDIATRIA" as const,
      role: "MEDICO" as const,
      isActive: true,
    },
    {
      firstName: "Andrea",
      lastName: "López",
      dni: "33459102",
      email: "alopez@salamedica.com",
      phone: "+54 11 4980-2220",
      matricula: "MN 142109",
      especialidad: "TRAUMATOLOGIA" as const,
      role: "MEDICO" as const,
      isActive: false,
    },
  ];

  const medicosActivos: string[] = [];

  for (const m of medicos) {
    const creado = await prisma.user.upsert({
      where: { email: m.email },
      update: m,
      create: m,
    });
    if (creado.isActive) {
      medicosActivos.push(creado.id);
    }
  }
  console.log(`✅ Loaded ${medicos.length} medicos.`);

  // Catálogo fijo de vacunas (RF-04a). Upsert sin tocar `stockActual` en el
  // update para no resetear el stock acumulado ante re-seeds.
  const vacunas = [
    { nombre: "Vacuna contra la Hepatitis B" },
    { nombre: "Vacuna antipoliomielítica (Polio)" },
    { nombre: "Vacuna contra el VPH (Virus del Papiloma Humano)" },
  ];

  for (const v of vacunas) {
    await prisma.vacuna.upsert({
      where: { nombre: v.nombre },
      update: { nombre: v.nombre },
      create: { nombre: v.nombre, stockActual: 0 },
    });
  }
  console.log(`✅ Loaded ${vacunas.length} vacunas.`);

  // Catálogo de coberturas médicas comunes (RF-05b / US-20). Se precargan para
  // que los pacientes tengan opciones al registrar su cobertura (US-21); los
  // médicos activos del seed las aceptan por defecto.
  const coberturas = [
    "OSDE",
    "IOMA",
    "Swiss Medical",
    "PAMI",
    "Galeno",
    "Medifé",
  ];

  const coberturasCreadas: { id: string; nombre: string }[] = [];
  for (const nombre of coberturas) {
    const c = await prisma.cobertura.upsert({
      where: { nombreNormalizado: nombre.trim().toLowerCase() },
      update: {},
      create: {
        nombre: nombre.trim(),
        nombreNormalizado: nombre.trim().toLowerCase(),
      },
    });
    coberturasCreadas.push({ id: c.id, nombre: c.nombre });
  }
  console.log(`✅ Loaded ${coberturasCreadas.length} coberturas.`);

  for (const medicoId of medicosActivos) {
    for (const cobertura of coberturasCreadas) {
      await prisma.medicoCobertura.upsert({
        where: {
          medicoId_coberturaId: {
            medicoId,
            coberturaId: cobertura.id,
          },
        },
        update: {},
        create: { medicoId, coberturaId: cobertura.id },
      });
    }
  }

  console.log("✨ Seed completed successfully.");
}

main()
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

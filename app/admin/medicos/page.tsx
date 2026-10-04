import { getPrisma } from "../../../lib/prisma";
import { MedicosClient, type MedicoItem } from "./medicos-client";

export const dynamic = "force-dynamic";

export default async function MedicosPage() {
  const prisma = getPrisma();

  const medicosDb = await prisma.user.findMany({
    where: { role: "MEDICO" },
    orderBy: { lastName: "asc" },
  });

  const medicos: MedicoItem[] = medicosDb.map((m) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    dni: m.dni,
    email: m.email,
    phone: m.phone,
    matricula: m.matricula,
    especialidad: m.especialidad,
    isActive: m.isActive,
  }));

  return <MedicosClient initialMedicos={medicos} />;
}

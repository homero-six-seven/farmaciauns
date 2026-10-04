import { getPrisma } from "../../../lib/prisma";
import { EnfermerasClient, type EnfermeraItem } from "./enfermeras-client";

export const dynamic = "force-dynamic";

export default async function EnfermerasPage() {
  const prisma = getPrisma();

  const enfermerasDb = await prisma.user.findMany({
    where: { role: "ENFERMERA" },
    orderBy: { lastName: "asc" },
  });

  const enfermeras: EnfermeraItem[] = enfermerasDb.map((e) => ({
    id: e.id,
    firstName: e.firstName,
    lastName: e.lastName,
    dni: e.dni,
    email: e.email,
    phone: e.phone,
    isActive: e.isActive,
  }));

  return <EnfermerasClient enfermeras={enfermeras} />;
}

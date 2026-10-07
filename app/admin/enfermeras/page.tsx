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

  // El orden de la base depende de su collation (los acentos pueden quedar al final)
  enfermeras.sort((a, b) =>
    (a.lastName ?? "").localeCompare(b.lastName ?? "", "es", { sensitivity: "base" }) ||
    (a.firstName ?? "").localeCompare(b.firstName ?? "", "es", { sensitivity: "base" }),
  );

  return <EnfermerasClient enfermeras={enfermeras} />;
}

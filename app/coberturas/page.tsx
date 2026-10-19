import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { getCurrentDbUser } from "@/lib/auth";
import {
  listarCatalogoCoberturas,
  listarCoberturasDeMedico,
} from "@/lib/cobertura-service";
import { CoberturasForm } from "./coberturas-form";
import { CoberturasLista } from "./coberturas-lista";

export const dynamic = "force-dynamic";

/**
 * US-20 (RF-05b) — "Mis coberturas" (solo MEDICO).
 *
 * Lista las coberturas que el médico acepta, permite agregar (con sugerencias
 * del catálogo, case-insensitive) y quitar (con confirmación).
 */
export default async function CoberturasPage() {
  await requireRole(["medico"]);

  const dbUser = await getCurrentDbUser();
  const medicoId = dbUser?.id ?? "";

  const [misCoberturas, catalogo] = await Promise.all([
    listarCoberturasDeMedico(medicoId),
    listarCatalogoCoberturas(),
  ]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <Link
          href="/inicio"
          className="text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Inicio
        </Link>
        <span className="text-outline">/</span>
        <span className="text-on-surface">Mis coberturas</span>
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Mis coberturas</h1>
        <p className="mt-1 text-on-surface-variant">
          Gestioná las obras sociales y coberturas médicas que aceptás. Se
          ofrecen a los pacientes que se registran.
        </p>
      </div>

      <CoberturasForm catalogo={catalogo.map((c) => c.nombre)} />

      <div className="mt-6">
        <CoberturasLista coberturas={misCoberturas} />
      </div>
    </div>
  );
}

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
 * Píldora con el conteo de convenios habilitados, formulario con autocomplete
 * enriquecido (case-insensitive) y listado con confirmación al quitar, alineado
 * con las wireframes. Panel lateral con "Volver al inicio".
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
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                <Link
                  href="/inicio"
                  className="text-on-surface-variant transition-colors hover:text-on-surface"
                >
                  Inicio
                </Link>
                <span className="text-outline">/</span>
                <span className="text-on-surface">Mis coberturas</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Mis coberturas
              </h1>
              <p className="mt-1 text-on-surface-variant">
                Indicá qué coberturas aceptás. Los pacientes van a poder
                elegirlas al registrar su cobertura.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-lg bg-surface-container px-4 py-2 md:self-auto">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                assignment_turned_in
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                  Convenios habilitados
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {misCoberturas.length} activa{misCoberturas.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <CoberturasForm catalogo={catalogo} />

          <div className="mt-6">
            <CoberturasLista coberturas={misCoberturas} />
          </div>
        </div>
  );
}

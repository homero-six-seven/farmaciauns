import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { getCurrentDbUser } from "@/lib/auth";
import {
  listarCoberturasDisponibles,
  obtenerCoberturaDePaciente,
} from "@/lib/cobertura-service";
import { CoberturaForm } from "./cobertura-form";

export const dynamic = "force-dynamic";

/**
 * US-21 (RF-05b) — "Mi cobertura" (solo PACIENTE).
 *
 * Si no hay cobertura registrada muestra un banner informativo y el formulario
 * (desplegable "Particular" + disponibles). Si ya la tiene, muestra una card
 * "COBERTURA ACTIVA". Modificar la cobertura corresponde a RF-15.
 */
export default async function MiCoberturaPage() {
  await requireRole(["paciente"]);

  const dbUser = await getCurrentDbUser();
  const pacienteId = dbUser?.id ?? "";

  const [cobertura, disponibles] = await Promise.all([
    obtenerCoberturaDePaciente(pacienteId),
    listarCoberturasDisponibles(),
  ]);

  const tieneCobertura =
    cobertura.coberturaId != null || cobertura.esParticular;

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
            <span className="text-on-surface">Cobertura médica</span>
          </div>

          <div className="mb-6 flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">Mi cobertura</h1>
            <p className="mt-1 text-on-surface-variant">
              Gestión de afiliación y estado de prestaciones.
            </p>
          </div>

          {tieneCobertura ? (
            <ResumenCobertura
              nombre={cobertura.nombre ?? "Particular"}
              numeroAfiliado={cobertura.numeroAfiliado}
            />
          ) : (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-lg bg-surface-container-low p-4">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  info
                </span>
                <p className="text-sm font-medium text-on-surface">
                  Todavía no registraste tu cobertura.
                </p>
              </div>
              <CoberturaForm coberturas={disponibles} />
            </>
          )}
        </div>
  );
}

/**
 * Vista de solo lectura cuando el paciente YA tiene cobertura registrada
 * (US-21 CA4). Modificar la cobertura corresponde a RF-15.
 */
function ResumenCobertura({
  nombre,
  numeroAfiliado,
}: {
  nombre: string;
  numeroAfiliado: string | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="rounded-t-xl bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-on-surface">
                Cobertura activa
              </span>
            </div>
            <span className="material-symbols-outlined text-[22px] text-on-surface">
              verified_user
            </span>
          </div>
        </div>
        <dl className="flex flex-col gap-4 p-5">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Cobertura
            </dt>
            <dd className="text-base font-semibold text-on-surface">{nombre}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 border-t border-surface-container-high pt-4">
            <dt className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Número de afiliado
            </dt>
            <dd className="font-mono text-sm text-on-surface">
              {numeroAfiliado ?? "—"}
            </dd>
          </div>
        </dl>
      </section>

      <div className="rounded-xl bg-surface-container-lowest p-5 text-sm text-on-surface-variant shadow-sm">
        <span className="font-semibold text-on-surface">
          Actualizaciones o cambios
        </span>{" "}
        — Para modificaciones en tu plan o titularidad, acercate a la secretaría
        de admisión de la sala.
      </div>
    </div>
  );
}

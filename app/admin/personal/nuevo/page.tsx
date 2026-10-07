import { FormBaseLayout } from "@/components/form-base-layout";
import { requireRole } from "@/lib/authorization";
import { AltaPersonalAdministrativoForm } from "./alta-form";

export const dynamic = "force-dynamic";

/**
 * US-07 (RF-16) — Alta de personal administrativo (exclusivo ADMINISTRADOR).
 */
export default async function AltaPersonalAdministrativoPage() {
  await requireRole(["admin"]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <span>Módulo administrativo</span>
        <span className="text-outline">/</span>
        <span className="text-on-surface">Alta de personal adm.</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Alta de personal adm.
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Ingresá los datos del agente institucional para habilitar su acceso.
        </p>
      </div>

      <FormBaseLayout>
        <AltaPersonalAdministrativoForm />
      </FormBaseLayout>
    </div>
  );
}

import { FormBaseLayout } from "@/components/form-base-layout";
import { requireRole } from "@/lib/authorization";
import { AltaMedicoForm } from "./alta-form";

export const dynamic = "force-dynamic";

/**
 * US-04 (RF-10) — Alta de médico (exclusivo ADMINISTRADOR).
 */
export default async function AltaMedicoPage() {
  await requireRole(["admin"]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <span>Módulo administrativo</span>
        <span className="text-outline">/</span>
        <span className="text-on-surface">Alta de médico</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Alta de médico</h1>
        <p className="mt-1 text-on-surface-variant">
          Ingresá los datos del profesional de la salud para habilitar su
          acceso al sistema.
        </p>
      </div>

      <FormBaseLayout>
        <AltaMedicoForm />
      </FormBaseLayout>
    </div>
  );
}

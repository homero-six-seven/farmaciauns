import { FormBaseLayout } from "@/components/form-base-layout";
import { requireRole } from "@/lib/authorization";
import { AltaEnfermeraForm } from "./alta-form";

export const dynamic = "force-dynamic";

/**
 * US-14 (RF-26) — Alta de enfermera (exclusivo ADMINISTRADOR).
 */
export default async function AltaEnfermeraPage() {
  await requireRole(["admin"]);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <span>Módulo administrativo</span>
        <span className="text-outline">/</span>
        <span className="text-on-surface">Alta de enfermería</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          Alta de enfermería
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Ingresá los datos del personal de enfermería para habilitar su
          acceso.
        </p>
      </div>

      <FormBaseLayout>
        <AltaEnfermeraForm />
      </FormBaseLayout>
    </div>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { listarVacunas } from "@/lib/stock-service";
import { StockForm } from "./stock-form";

export const dynamic = "force-dynamic";

/**
 * US-24 (RF-04a) — Stock de vacunas (acceso EXCLUSIVO para Enfermera).
 *
 * Lista las unidades disponibles de cada vacuna y permite registrar ingresos
 * (US-22) y egresos/ajustes con motivo (US-23). El stock nunca queda negativo.
 */
export default async function StockPage() {
  await requireRole(["enfermera"]);

  const vacunas = await listarVacunas();

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <Link
          href="/inicio"
          className="text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Inicio
        </Link>
        <span className="text-outline">/</span>
        <span className="text-on-surface">Stock de vacunas</span>
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Stock de vacunas</h1>
        <p className="mt-1 text-on-surface-variant">
          Unidades disponibles de cada vacuna. Registrá ingresos y egresos con
          su motivo.
        </p>
      </div>

      <section className="mb-6 overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="px-4 py-2.5" scope="col">
                  Vacuna
                </th>
                <th className="px-4 py-2.5 text-right" scope="col">
                  Unidades disponibles
                </th>
              </tr>
            </thead>
            <tbody>
              {vacunas.map((v) => (
                <tr key={v.id} className="border-t border-surface-container-high">
                  <td className="px-4 py-3 font-medium text-on-surface">
                    {v.nombre}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-on-surface">
                    {v.stockActual}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-surface-container-high bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
          {vacunas.length} vacunas en el catálogo fijo
        </div>
      </section>

      <StockForm vacunas={vacunas} />
    </div>
  );
}

import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import { listarVacunas } from "@/lib/stock-service";
import { StockModals } from "./stock-modals";
import { StockToast } from "./stock-toast";

export const dynamic = "force-dynamic";

/**
 * US-24 (RF-04a) — Stock de vacunas (acceso EXCLUSIVO para Enfermera).
 *
 * Métricas de catálogo/disponibilidad, tabla de unidades con badge "SIN STOCK"
 * y movimientos (ingreso/egreso) vía modales (US-22/23), alineado con las
 * wireframes. Panel lateral con "Volver al inicio".
 */
export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  await requireRole(["enfermera"]);

  const vacunas = await listarVacunas();
  const { ok } = await searchParams;

  const stockTotal = vacunas.reduce((sum, v) => sum + v.stockActual, 0);

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
          {/* Encabezado */}
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
                <span className="text-on-surface">Stock de vacunas</span>
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight">
                Stock de vacunas
              </h1>
              <p className="mt-1 text-on-surface-variant">
                Control cuantitativo de biológicos en cadena de frío.
              </p>
            </div>
            <StockModals vacunas={vacunas} />
          </div>

          {/* Métricas */}
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Catálogo asignado
                </span>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  inventory_2
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold leading-none text-on-surface">
                {vacunas.length}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Variedades biológicas registradas
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Disponibilidad neta
                </span>
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">
                  vaccines
                </span>
              </div>
              <p className="mt-2 text-3xl font-bold leading-none text-on-surface">
                {stockTotal}
              </p>
              <p className="mt-1 text-xs text-on-surface-variant">
                Unidades aptas en depósito
              </p>
            </div>
          </div>

          {/* Tabla */}
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
                    <tr
                      key={v.id}
                      className="border-t border-surface-container-high transition-colors hover:bg-surface-container-low"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-container-high">
                            <span className="material-symbols-outlined text-[18px] text-on-surface">
                              vaccines
                            </span>
                          </span>
                          <span className="font-medium text-on-surface">
                            {v.nombre}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {v.stockActual === 0 ? (
                          <span className="inline-flex items-center rounded bg-surface-container-highest px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-on-surface">
                            Sin stock
                          </span>
                        ) : (
                          <span className="font-mono text-on-surface">
                            {v.stockActual} unidades
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-surface-container-high bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
              {vacunas.length} líneas · modo solo lectura de catálogo activo
            </div>
          </section>

        <StockToast ok={ok} />
        </div>
  );
}

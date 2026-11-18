import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import {
  diaSemanaDe,
  etiquetaDia,
  formatearHora,
} from "@/lib/domain/agenda";
import { formatearFecha } from "@/lib/domain/turno";
import { listarDosisAplicadas } from "@/lib/vacunacion-service";

export const dynamic = "force-dynamic";

/**
 * Administración de dosis (solo ENFERMERA) — registro cronológico de las
 * dosis aplicadas a cada paciente. Las dosis aplicadas son los turnos de
 * vacunación en estado "Atendido" (los que cierra "Vacuna aplicada" de
 * US-60). Búsqueda por nombre o DNI vía GET (progressive enhancement).
 */
export default async function DosisPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["enfermera"]);

  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const dosis = await listarDosisAplicadas(query);

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
        <span className="text-on-surface">Administración de dosis</span>
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Administración de dosis
        </h1>
        <p className="mt-1 text-on-surface-variant">
          Registro cronológico de las dosis aplicadas a cada paciente.
        </p>
      </div>

      {/* Métrica */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Dosis aplicadas
          </span>
          <p className="mt-2 text-3xl font-bold leading-none text-on-surface">
            {dosis.length}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {query ? `Resultados para "${query}"` : "En todo el registro"}
          </p>
        </div>
      </div>

      {/* Búsqueda por paciente */}
      <form
        method="GET"
        action="/dosis"
        className="mb-6 flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            htmlFor="dosis-paciente-search"
            className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            Buscar paciente por nombre o DNI
          </label>
          <input
            id="dosis-paciente-search"
            name="q"
            type="text"
            defaultValue={query}
            placeholder="Ej. María Gómez o 32.456.789"
            className="h-10 w-full rounded bg-surface px-3 text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
          >
            Buscar
          </button>
          <Link
            href="/dosis"
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container-low px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Limpiar
          </Link>
        </div>
      </form>

      {dosis.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-12 text-center shadow-sm">
          <span className="material-symbols-outlined mb-4 text-[40px] text-outline">
            vaccines
          </span>
          <p className="text-sm font-medium text-on-surface-variant">
            {query
              ? "No hay dosis aplicadas para ese paciente"
              : "Todavía no hay dosis aplicadas"}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-2.5" scope="col">
                    Fecha
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    Hora
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    Paciente
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    DNI
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    Vacuna
                  </th>
                </tr>
              </thead>
              <tbody>
                {dosis.map((d) => (
                  <tr
                    key={d.id}
                    className="border-t border-surface-container-high transition-colors hover:bg-surface-container-low"
                  >
                    <td className="px-4 py-3 text-on-surface">
                      {etiquetaDia(diaSemanaDe(d.fecha))} {formatearFecha(d.fecha)}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface">
                      {formatearHora(d.inicioMin)} hs
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {d.paciente.nombreCompleto}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {d.paciente.dni ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-on-surface">{d.vacuna}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-surface-container-high bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
            Mostrando {dosis.length} de {dosis.length} dosis aplicadas
          </div>
        </section>
      )}
    </div>
  );
}

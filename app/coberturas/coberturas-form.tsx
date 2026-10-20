"use client";

import { useActionState, useMemo, useState } from "react";
import { agregarCobertura } from "@/app/actions";
import { ESTADO_INICIAL } from "@/lib/form-state";
import type { CoberturaResumen } from "@/lib/cobertura-service";

/**
 * Formulario para agregar una cobertura a "Mis coberturas" (US-20).
 * Autocomplete enriquecido: a medida que se escribe, se despliega la nómina de
 * coberturas ya cargadas (case-insensitive); el backend normaliza y evita
 * duplicados.
 */
export function CoberturasForm({
  catalogo,
}: {
  catalogo: CoberturaResumen[];
}) {
  const [state, formAction, pending] = useActionState(
    agregarCobertura,
    ESTADO_INICIAL,
  );
  const [query, setQuery] = useState("");
  const [abierto, setAbierto] = useState(false);

  const coincidencias = useMemo(() => {
    const termino = query.trim().toLowerCase();
    if (!termino) return [];
    return catalogo
      .filter((c) => c.nombre.toLowerCase().includes(termino))
      .slice(0, 8);
  }, [query, catalogo]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
    >
      {state.errors._form && (
        <div
          role="alert"
          className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
        >
          {state.errors._form}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex flex-1 flex-col gap-1.5">
          <label
            htmlFor="cobertura-nombre"
            className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            Nombre de la cobertura
          </label>
          <input
            id="cobertura-nombre"
            name="nombre"
            type="text"
            required
            autoComplete="off"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setAbierto(true);
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 150)}
            placeholder="Ej. OSDE, IOMA, PAMI"
            className="h-10 w-full rounded bg-surface px-3 text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />

          {abierto && coincidencias.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-lg bg-surface-container-lowest shadow-xl">
              <div className="bg-surface-container-low px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Coincidencias en la nómina
              </div>
              <ul className="max-h-64 overflow-y-auto">
                {coincidencias.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onMouseDown={() => {
                        setQuery(c.nombre);
                        setAbierto(false);
                      }}
                      className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-on-surface transition-colors hover:bg-surface-container-low"
                    >
                      <span>{c.nombre}</span>
                      {c.nombre.toLowerCase() === query.trim().toLowerCase() && (
                        <span className="rounded bg-surface-container-highest px-2 py-0.5 text-[10px] font-semibold uppercase text-on-surface">
                          Exacta
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {pending ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </div>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { agregarCobertura } from "@/app/actions";
import { ESTADO_INICIAL } from "@/lib/form-state";

/**
 * Formulario para agregar una cobertura a "Mis coberturas".
 * El `<datalist>` sugiere las coberturas ya cargadas (autocomplete) para
 * evitar duplicados; el backend normaliza case-insensitive.
 */
export function CoberturasForm({ catalogo }: { catalogo: string[] }) {
  const [state, formAction, pending] = useActionState(
    agregarCobertura,
    ESTADO_INICIAL,
  );

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
        <div className="flex flex-1 flex-col gap-1.5">
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
            list="coberturas-sugerencias"
            defaultValue={state.values?.nombre}
            placeholder="Ej. OSDE, IOMA, PAMI"
            className="h-10 w-full rounded bg-surface px-3 text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <datalist id="coberturas-sugerencias">
            {catalogo.map((nombre) => (
              <option key={nombre} value={nombre} />
            ))}
          </datalist>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Agregando…" : "Agregar"}
          </button>
        </div>
      </div>
    </form>
  );
}

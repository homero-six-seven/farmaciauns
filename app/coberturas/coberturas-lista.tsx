"use client";

import { quitarCobertura } from "@/app/actions";
import type { CoberturaResumen } from "@/lib/cobertura-service";

/**
 * Listado de coberturas aceptadas por el médico, con botón de quitar
 * (confirmación previa, US-20). Desvincular NO borra la cobertura del
 * catálogo; los pacientes que ya la tienen la conservan.
 */
export function CoberturasLista({
  coberturas,
}: {
  coberturas: CoberturaResumen[];
}) {
  if (coberturas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-12 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-on-surface">
          Todavía no aceptás ninguna cobertura
        </h2>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">
          Agregá la primera con el formulario de arriba. Tus coberturas se van
          a ofrecer a los pacientes en el registro.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {coberturas.map((c) => (
        <li
          key={c.id}
          className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3 shadow-sm"
        >
          <span className="text-sm font-medium text-on-surface">
            {c.nombre}
          </span>
          <form
            action={quitarCobertura}
            onSubmit={(e) => {
              if (!window.confirm(`¿Quitar "${c.nombre}" de tus coberturas?`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="coberturaId" value={c.id} />
            <button
              type="submit"
              className="inline-flex h-8 items-center justify-center rounded bg-surface-container-high px-3 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-error hover:text-on-primary"
            >
              Quitar
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}

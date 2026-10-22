"use client";

import { useState } from "react";
import { quitarCobertura } from "@/app/actions";
import type { CoberturaResumen } from "@/lib/cobertura-service";

/**
 * Listado de coberturas aceptadas por el médico, con botón "Quitar" que abre
 * un diálogo de confirmación (US-20), en lugar de `window.confirm`. Desvincular
 * NO borra la cobertura del catálogo; los pacientes que ya la tienen la
 * conservan.
 */
export function CoberturasLista({
  coberturas,
}: {
  coberturas: CoberturaResumen[];
}) {
  const [confirmar, setConfirmar] = useState<CoberturaResumen | null>(null);

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
    <>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-sm font-semibold text-on-surface">
          Coberturas que aceptás
        </h2>
        <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
          Orden alfabético
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {coberturas.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-xl bg-surface-container-lowest px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-highest">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  health_and_safety
                </span>
              </span>
              <span className="text-sm font-medium text-on-surface">
                {c.nombre}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmar(c)}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded bg-surface-container px-3 text-xs font-semibold text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[16px]">
                remove_circle_outline
              </span>
              Quitar
            </button>
          </li>
        ))}
      </ul>

      {confirmar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirmar(null);
          }}
        >
          <div className="w-full max-w-sm overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
            <div className="flex items-center gap-2 bg-surface-container-low px-5 py-3">
              <span className="material-symbols-outlined text-[18px] text-on-surface">
                warning
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-on-surface">
                Acción requerida
              </span>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex flex-col gap-1">
                <h3 className="text-base font-semibold text-on-surface">
                  ¿Quitar {confirmar.nombre} de tus coberturas?
                </h3>
                <p className="text-sm text-on-surface-variant">
                  Los pacientes ya no van a poder seleccionarla para nuevos
                  registros. Quienes ya la tenían registrada la conservan.
                </p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmar(null)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  Cancelar
                </button>
                <form
                  action={quitarCobertura}
                  onSubmit={() => setConfirmar(null)}
                >
                  <input
                    type="hidden"
                    name="coberturaId"
                    value={confirmar.id}
                  />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-inverse-surface"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      delete
                    </span>
                    Quitar
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

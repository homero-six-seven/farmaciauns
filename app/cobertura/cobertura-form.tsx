"use client";

import { useActionState, useState } from "react";
import { registrarCoberturaPaciente } from "@/app/actions";
import { ESTADO_INICIAL } from "@/lib/form-state";

type CoberturaDisponible = { id: string; nombre: string };

/**
 * Formulario de "Mi cobertura" (US-21, solo PACIENTE).
 *
 * El desplegable ofrece "Particular" y las coberturas que acepta al menos un
 * médico activo. Si elige una cobertura, el nº de afiliado es obligatorio; si
 * elige "Particular", no se pide.
 */
export function CoberturaForm({
  coberturas,
}: {
  coberturas: CoberturaDisponible[];
}) {
  const [state, formAction, pending] = useActionState(
    registrarCoberturaPaciente,
    ESTADO_INICIAL,
  );
  const [seleccionada, setSeleccionada] = useState("");

  const esParticular = seleccionada === "";

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
    >
      {state.errors._form && (
        <div
          role="alert"
          className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
        >
          {state.errors._form}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="coberturaId"
          className="text-sm font-medium text-on-surface"
        >
          Cobertura médica
        </label>
        <select
          id="coberturaId"
          name="coberturaId"
          defaultValue={state.values?.coberturaId ?? ""}
          onChange={(e) => setSeleccionada(e.target.value)}
          aria-invalid={Boolean(state.errors.coberturaId)}
          className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">Particular</option>
          {coberturas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
        {state.errors.coberturaId && (
          <span role="alert" className="text-xs font-medium text-error">
            {state.errors.coberturaId}
          </span>
        )}
      </div>

      {esParticular ? (
        <div className="flex items-start gap-2 rounded-lg bg-surface-container p-4">
          <span className="material-symbols-outlined text-[20px] text-on-surface">
            receipt_long
          </span>
          <p className="text-sm text-on-surface">
            Sin intermediación de obra social ni prepaga. Los aranceles de las
            consultas se abonan en la sala médica.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="numeroAfiliado"
            className="text-sm font-medium text-on-surface"
          >
            Número de afiliado
            <span className="font-semibold text-error">*</span>
          </label>
          <input
            id="numeroAfiliado"
            name="numeroAfiliado"
            type="text"
            required
            defaultValue={state.values?.numeroAfiliado}
            placeholder="Ej. 1102-4589-01"
            aria-invalid={Boolean(state.errors.numeroAfiliado)}
            className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {state.errors.numeroAfiliado && (
            <span role="alert" className="text-xs font-medium text-error">
              {state.errors.numeroAfiliado}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-end border-t border-surface-container-high pt-4">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
  );
}

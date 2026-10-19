"use client";

import { useActionState, useState } from "react";
import {
  registrarEgresoStock,
  registrarIngresoStock,
} from "@/app/actions";
import { ESTADO_INICIAL } from "@/lib/form-state";
import { ETIQUETA_MOTIVO, MOTIVOS_EGRESO } from "@/lib/domain/vacuna";
import type { VacunaConStock } from "@/lib/stock-service";

type VacunaOption = VacunaConStock;

/**
 * Formularios de ingreso (US-22) y egreso/ajuste (US-23) de stock.
 *
 * El egreso exige motivo; si el motivo es "Otro", se muestra el campo de
 * detalle (obligatorio). El backend garantiza stock nunca negativo.
 */
export function StockForm({ vacunas }: { vacunas: VacunaOption[] }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <FormIngreso vacunas={vacunas} />
      <FormEgreso vacunas={vacunas} />
    </div>
  );
}

function FormIngreso({ vacunas }: { vacunas: VacunaOption[] }) {
  const [state, formAction, pending] = useActionState(
    registrarIngresoStock,
    ESTADO_INICIAL,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-on-surface">
          Registrar ingreso
        </h2>
        <p className="text-xs text-on-surface-variant">
          Suma unidades recibidas al stock actual.
        </p>
      </div>

      {state.errors._form && (
        <Alerta texto={state.errors._form} />
      )}

      <CampoSelect
        name="vacunaId"
        label="Vacuna"
        vacunas={vacunas}
        defaultValue={state.values?.vacunaId}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="ingreso-cantidad"
          className="text-sm font-medium text-on-surface"
        >
          Cantidad<span className="font-semibold text-error">*</span>
        </label>
        <input
          id="ingreso-cantidad"
          name="cantidad"
          type="number"
          min={1}
          step={1}
          required
          inputMode="numeric"
          defaultValue={state.values?.cantidad}
          placeholder="Ej. 50"
          aria-invalid={Boolean(state.errors.cantidad)}
          className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {state.errors.cantidad && (
          <span role="alert" className="text-xs font-medium text-error">
            {state.errors.cantidad}
          </span>
        )}
      </div>

      <BotonSubmit pending={pending} texto="Registrar ingreso" />
    </form>
  );
}

function FormEgreso({ vacunas }: { vacunas: VacunaOption[] }) {
  const [state, formAction, pending] = useActionState(
    registrarEgresoStock,
    ESTADO_INICIAL,
  );
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm"
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-on-surface">
          Registrar egreso / ajuste
        </h2>
        <p className="text-xs text-on-surface-variant">
          Descuenta unidades. El stock nunca puede quedar negativo.
        </p>
      </div>

      {state.errors._form && <Alerta texto={state.errors._form} />}

      <CampoSelect
        name="vacunaId"
        label="Vacuna"
        vacunas={vacunas}
        defaultValue={state.values?.vacunaId}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="egreso-cantidad"
          className="text-sm font-medium text-on-surface"
        >
          Cantidad<span className="font-semibold text-error">*</span>
        </label>
        <input
          id="egreso-cantidad"
          name="cantidad"
          type="number"
          min={1}
          step={1}
          required
          inputMode="numeric"
          defaultValue={state.values?.cantidad}
          placeholder="Ej. 10"
          aria-invalid={Boolean(state.errors.cantidad)}
          className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {state.errors.cantidad && (
          <span role="alert" className="text-xs font-medium text-error">
            {state.errors.cantidad}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="egreso-motivo"
          className="text-sm font-medium text-on-surface"
        >
          Motivo<span className="font-semibold text-error">*</span>
        </label>
        <select
          id="egreso-motivo"
          name="motivo"
          required
          defaultValue={state.values?.motivo}
          onChange={(e) => setMostrarDetalle(e.target.value === "OTRO")}
          aria-invalid={Boolean(state.errors.motivo)}
          className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="" disabled>
            Seleccioná un motivo
          </option>
          {MOTIVOS_EGRESO.map((m) => (
            <option key={m} value={m}>
              {ETIQUETA_MOTIVO[m]}
            </option>
          ))}
        </select>
        {state.errors.motivo && (
          <span role="alert" className="text-xs font-medium text-error">
            {state.errors.motivo}
          </span>
        )}
      </div>

      {mostrarDetalle && (
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="egreso-detalle"
            className="text-sm font-medium text-on-surface"
          >
            Detalle<span className="font-semibold text-error">*</span>
          </label>
          <input
            id="egreso-detalle"
            name="motivoDetalle"
            type="text"
            required
            defaultValue={state.values?.motivoDetalle}
            placeholder="Describí el motivo"
            aria-invalid={Boolean(state.errors.motivoDetalle)}
            className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          {state.errors.motivoDetalle && (
            <span role="alert" className="text-xs font-medium text-error">
              {state.errors.motivoDetalle}
            </span>
          )}
        </div>
      )}

      <BotonSubmit pending={pending} texto="Registrar egreso" />
    </form>
  );
}

function CampoSelect({
  name,
  label,
  vacunas,
  defaultValue,
}: {
  name: string;
  label: string;
  vacunas: VacunaOption[];
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        {label}
        <span className="font-semibold text-error">*</span>
      </label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <option value="" disabled>
          Seleccioná una vacuna
        </option>
        {vacunas.map((v) => (
          <option key={v.id} value={v.id}>
            {v.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}

function Alerta({ texto }: { texto: string }) {
  return (
    <div
      role="alert"
      className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
    >
      {texto}
    </div>
  );
}

function BotonSubmit({ pending, texto }: { pending: boolean; texto: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Guardando…" : texto}
    </button>
  );
}

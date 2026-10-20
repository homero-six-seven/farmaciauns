"use client";

import { useActionState, useState } from "react";
import {
  registrarEgresoStock,
  registrarIngresoStock,
} from "@/app/actions";
import { ESTADO_INICIAL } from "@/lib/form-state";
import { ETIQUETA_MOTIVO, MOTIVOS_EGRESO } from "@/lib/domain/vacuna";
import type { VacunaConStock } from "@/lib/stock-service";

type TipoModal = "ingreso" | "egreso" | null;

/**
 * Botones "Registrar ingreso/egreso" + modales correspondientes (US-22/23).
 * Reemplaza los formularios inline: los movimientos se operan desde un diálogo,
 * como indican las wireframes, y al confirmar se redirige a `/stock` con el
 * resultado actualizado.
 */
export function StockModals({ vacunas }: { vacunas: VacunaConStock[] }) {
  const [abierto, setAbierto] = useState<TipoModal>(null);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAbierto("egreso")}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[18px]">remove</span>
          Registrar egreso
        </button>
        <button
          type="button"
          onClick={() => setAbierto("ingreso")}
          className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-inverse-surface"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Registrar ingreso
        </button>
      </div>

      {abierto === "ingreso" && (
        <ModalIngreso vacunas={vacunas} onClose={() => setAbierto(null)} />
      )}
      {abierto === "egreso" && (
        <ModalEgreso vacunas={vacunas} onClose={() => setAbierto(null)} />
      )}
    </>
  );
}

function Overlay({
  titulo,
  icono,
  onClose,
  children,
}: {
  titulo: string;
  icono: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between bg-surface-container-low px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-on-surface">
              {icono}
            </span>
            <h3 className="text-base font-semibold text-on-surface">{titulo}</h3>
          </div>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>
        <div className="overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function ModalIngreso({
  vacunas,
  onClose,
}: {
  vacunas: VacunaConStock[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    registrarIngresoStock,
    ESTADO_INICIAL,
  );
  const [vacunaId, setVacunaId] = useState("");

  const seleccionada = vacunas.find((v) => v.id === vacunaId);

  return (
    <Overlay titulo="Registrar ingreso" icono="add_circle" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4 p-5">
        {state.errors._form && <Alerta texto={state.errors._form} />}

        <CampoVacuna
          name="vacunaId"
          vacunas={vacunas}
          defaultValue={state.values?.vacunaId}
          onChange={setVacunaId}
          hint={
            seleccionada
              ? `Stock actual: ${seleccionada.stockActual} unidades`
              : undefined
          }
        />

        <CampoCantidad
          name="cantidad"
          label="Cantidad recibida (unidades)"
          error={state.errors.cantidad}
          defaultValue={state.values?.cantidad}
        />

        <Acciones onClose={onClose} pending={pending} confirmar="Confirmar" />
      </form>
    </Overlay>
  );
}

function ModalEgreso({
  vacunas,
  onClose,
}: {
  vacunas: VacunaConStock[];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    registrarEgresoStock,
    ESTADO_INICIAL,
  );
  const [vacunaId, setVacunaId] = useState("");
  const [motivo, setMotivo] = useState("");

  const seleccionada = vacunas.find((v) => v.id === vacunaId);

  return (
    <Overlay titulo="Registrar egreso" icono="remove_circle_outline" onClose={onClose}>
      <form action={formAction} className="flex flex-col gap-4 p-5">
        {state.errors._form && <Alerta texto={state.errors._form} />}

        <CampoVacuna
          name="vacunaId"
          vacunas={vacunas}
          defaultValue={state.values?.vacunaId}
          onChange={setVacunaId}
          hint={seleccionada ? `Disponible: ${seleccionada.stockActual} u.` : undefined}
        />

        <CampoCantidad
          name="cantidad"
          label="Cantidad a descontar (unidades)"
          error={state.errors.cantidad}
          defaultValue={state.values?.cantidad}
        />

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
            onChange={(e) => setMotivo(e.target.value)}
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

        {motivo === "OTRO" && (
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

        <Acciones onClose={onClose} pending={pending} confirmar="Confirmar" />
      </form>
    </Overlay>
  );
}

function CampoVacuna({
  name,
  vacunas,
  defaultValue,
  onChange,
  hint,
}: {
  name: string;
  vacunas: VacunaConStock[];
  defaultValue?: string;
  onChange: (id: string) => void;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        Vacuna<span className="font-semibold text-error">*</span>
      </label>
      <select
        id={name}
        name={name}
        required
        defaultValue={defaultValue}
        onChange={(e) => onChange(e.target.value)}
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
      {hint && (
        <span className="text-xs text-on-surface-variant">{hint}</span>
      )}
    </div>
  );
}

function CampoCantidad({
  name,
  label,
  error,
  defaultValue,
}: {
  name: string;
  label: string;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        {label}
        <span className="font-semibold text-error">*</span>
      </label>
      <input
        id={name}
        name={name}
        type="number"
        min={1}
        step={1}
        required
        inputMode="numeric"
        defaultValue={defaultValue}
        placeholder="Ej. 25"
        aria-invalid={Boolean(error)}
        className="h-10 w-full rounded bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
      {error && (
        <span role="alert" className="text-xs font-medium text-error">
          {error}
        </span>
      )}
    </div>
  );
}

function Acciones({
  onClose,
  pending,
  confirmar,
}: {
  onClose: () => void;
  pending: boolean;
  confirmar: string;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-inverse-surface disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Guardando…" : confirmar}
      </button>
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

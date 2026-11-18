"use client";

import { useState } from "react";
import { useActionState } from "react";
import { TriangleAlert } from "lucide-react";
import { ESTADO_INICIAL } from "@/lib/form-state";
import { cancelarTurnoDeVacunacion } from "./actions";

/**
 * Acciones de una fila de la lista de turnos de vacunación (US-34). Por ahora
 * solo "Cancelar" (US-35) para turnos futuros reservados; US-60 suma "Vacuna
 * aplicada" y "Ausente". Al confirmar, el server action revalida la lista y
 * Next refresca la ruta; el modal se cierra porque el estado devuelve `ok`.
 */
export function AccionesTurnoVacunacion({
  turnoId,
  nombrePaciente,
  dni,
  vacuna,
  fechaEtiqueta,
  cancelable,
}: {
  turnoId: string;
  nombrePaciente: string;
  dni: string | null;
  vacuna: string;
  fechaEtiqueta: string;
  cancelable: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [state, formAction, pending] = useActionState(cancelarTurnoDeVacunacion, ESTADO_INICIAL);
  const exito = Boolean(state.values?.ok);

  if (!cancelable) {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="inline-flex h-8 items-center gap-1.5 rounded bg-surface-container-high px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
      >
        <span className="material-symbols-outlined text-[16px]">cancel</span>
        Cancelar
      </button>

      {abierto && !exito && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Cancelar turno de vacunación"
          onClick={(e) => {
            if (e.target === e.currentTarget) setAbierto(false);
          }}
        >
          <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
            <div className="flex items-center justify-between bg-surface-container-low px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  event_busy
                </span>
                <h3 className="text-base font-semibold text-on-surface">
                  Cancelar turno de vacunación
                </h3>
              </div>
              <button
                type="button"
                aria-label="Cerrar"
                onClick={() => setAbierto(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form action={formAction} className="flex flex-col gap-4 p-5">
              <input type="hidden" name="turnoId" value={turnoId} />

              {state.errors._form && (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
                >
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {state.errors._form}
                </div>
              )}

              <p className="text-sm font-semibold text-on-surface">
                ¿Cancelar el turno de vacunación de {nombrePaciente}?
              </p>
              <p className="rounded-lg bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
                El horario queda libre y la dosis vuelve al stock.
              </p>

              <dl className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4 text-sm">
                <Fila etiqueta="Fecha y hora" valor={fechaEtiqueta} />
                <Fila
                  etiqueta="Paciente"
                  valor={dni ? `${nombrePaciente} (DNI ${dni})` : nombrePaciente}
                />
                <Fila etiqueta="Vacuna" valor={vacuna} />
              </dl>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  Volver
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex h-10 items-center justify-center gap-1 rounded-lg bg-error px-4 text-sm font-semibold text-on-error transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pending ? "Cancelando…" : "Cancelar turno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {etiqueta}
      </dt>
      <dd className="font-medium text-on-surface">{valor}</dd>
    </div>
  );
}

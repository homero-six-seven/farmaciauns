"use client";

import { Check, Minus, Plus, Timer } from "lucide-react";
import { useActionState, useState } from "react";
import {
  DURACIONES_COMUNES,
  DURACION_MAX,
  DURACION_MIN,
  PASO_MINUTOS,
} from "@/lib/domain/agenda";
import { ESTADO_INICIAL } from "@/lib/form-state";
import { guardarDuracionTurno } from "./actions";

/** Valor inicial del stepper cuando el médico todavía no definió su duración. */
const DURACION_SUGERIDA = 20;

/**
 * Tarjeta "Duración de tus turnos" (US-25), según el wireframe de US-25/26/28:
 * stepper de a 5 minutos, accesos rápidos y botón Guardar.
 */
export function DuracionForm({
  duracionActual,
  mes,
}: {
  duracionActual: number | null;
  mes: string;
}) {
  const [state, formAction, pending] = useActionState(
    guardarDuracionTurno,
    ESTADO_INICIAL,
  );
  const [duracion, setDuracion] = useState(
    duracionActual ?? DURACION_SUGERIDA,
  );
  const error = state.errors.duracionTurnoMin;
  const sinCambios = duracion === duracionActual;

  return (
    <section
      aria-labelledby="titulo-duracion"
      className="rounded-xl bg-surface-container-lowest p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2
          id="titulo-duracion"
          className="flex items-center gap-3 text-xl font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-on-primary">
            <Timer className="h-4 w-4" aria-hidden="true" />
          </span>
          Duración de tus turnos
        </h2>
        <span className="inline-flex items-center gap-2 rounded bg-surface-container px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-on-surface">
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${duracionActual ? "bg-primary" : "bg-outline"}`}
          />
          {duracionActual
            ? `Duración activa configurada: ${duracionActual} min`
            : "Sin duración configurada"}
        </span>
      </div>

      <p className="mt-3 text-sm text-on-surface-variant">
        Definí los minutos que dura cada consulta. Si ya cargaste
        disponibilidad, el cambio se aplica a tus turnos de hoy en adelante.
      </p>

      <form action={formAction} className="mt-5 flex flex-col gap-3">
        <input type="hidden" name="duracionTurnoMin" value={duracion} />
        <input type="hidden" name="mes" value={mes} />

        {state.errors._form && (
          <div
            role="alert"
            className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
          >
            {state.errors._form}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1 rounded-lg bg-surface-container-low p-1">
            <button
              type="button"
              onClick={() => setDuracion((d) => Math.max(DURACION_MIN, d - PASO_MINUTOS))}
              disabled={duracion <= DURACION_MIN}
              aria-label={`Restar ${PASO_MINUTOS} minutos`}
              className="flex h-10 w-10 items-center justify-center rounded bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <output
              aria-live="polite"
              aria-label="Duración seleccionada"
              className="flex w-24 items-baseline justify-center gap-1"
            >
              <span className="text-2xl font-semibold tabular-nums">{duracion}</span>
              <span className="text-xs text-on-surface-variant">min</span>
            </output>
            <button
              type="button"
              onClick={() => setDuracion((d) => Math.min(DURACION_MAX, d + PASO_MINUTOS))}
              disabled={duracion >= DURACION_MAX}
              aria-label={`Sumar ${PASO_MINUTOS} minutos`}
              className="flex h-10 w-10 items-center justify-center rounded bg-surface-container-lowest text-on-surface shadow-sm transition-colors hover:bg-surface-container disabled:opacity-40"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Comunes:
            </span>
            {DURACIONES_COMUNES.map((minutos) => (
              <button
                key={minutos}
                type="button"
                onClick={() => setDuracion(minutos)}
                aria-pressed={duracion === minutos}
                className={`rounded px-3 py-1.5 text-sm font-semibold transition-colors ${
                  duracion === minutos
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                {minutos}m
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={pending || sinCambios}
            className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:opacity-60"
          >
            <Check className="h-4 w-4" aria-hidden="true" />
            {pending ? "Guardando…" : "Guardar"}
          </button>
        </div>

        {error && (
          <span role="alert" className="text-xs font-medium text-error">
            {error}
          </span>
        )}
      </form>
    </section>
  );
}

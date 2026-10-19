"use client";

import { Check, Clock, Pencil, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useRef, useState } from "react";
import {
  DIAS_SEMANA,
  MSG_SIN_DURACION,
  PASO_MINUTOS,
  etiquetaDia,
  generarTurnos,
  parsearHora,
  validarFranjas,
  type DiaSemana,
} from "@/lib/domain/agenda";
import { ESTADO_INICIAL } from "@/lib/form-state";
import { guardarDisponibilidad } from "./actions";

/** Fila del patrón semanal tal como la muestra el editor (horas en "HH:MM"). */
export type FilaFranja = {
  diaSemana: DiaSemana;
  inicio: string;
  fin: string;
};

type FilaEditor = FilaFranja & { clave: string; editando: boolean };

const FILA_NUEVA = { inicio: "08:00", fin: "12:00" };

/**
 * Editor de "Franjas de atención ambulatoria" (US-26), según el wireframe de
 * US-25/26/28. Las filas se editan localmente y se validan en vivo con las
 * reglas del dominio; nada se guarda hasta "Guardar disponibilidad", que
 * reenvía el patrón a la server action para validarlo de nuevo.
 */
export function FranjasEditor({
  mes,
  meses,
  duracionTurnoMin,
  filasIniciales,
  precargadoDe,
}: {
  mes: string;
  meses: { valor: string; etiqueta: string }[];
  duracionTurnoMin: number | null;
  filasIniciales: FilaFranja[];
  /** Etiqueta del mes del que se precargó el patrón, si el mes está vacío. */
  precargadoDe: string | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    guardarDisponibilidad,
    ESTADO_INICIAL,
  );
  const [filas, setFilas] = useState<FilaEditor[]>(() =>
    filasIniciales.map((fila, i) => ({ ...fila, clave: `inicial-${i}`, editando: false })),
  );
  const siguienteClave = useRef(0);

  const bloqueado = duracionTurnoMin === null;
  const validacion = bloqueado ? null : validarFranjas(filas, duracionTurnoMin);
  const errores = validacion && !validacion.ok ? validacion.errores : {};
  const hayErrores = Object.keys(errores).length > 0;

  function actualizarFila(clave: string, cambios: Partial<FilaEditor>) {
    setFilas((actuales) =>
      actuales.map((fila) => (fila.clave === clave ? { ...fila, ...cambios } : fila)),
    );
  }

  function agregarFila() {
    // Propone el primer día de la semana que todavía no tiene franjas.
    const diasUsados = new Set(filas.map((f) => f.diaSemana));
    const dia = DIAS_SEMANA.find((d) => !diasUsados.has(d.valor))?.valor ?? 1;
    siguienteClave.current += 1;
    setFilas((actuales) => [
      ...actuales,
      { diaSemana: dia, ...FILA_NUEVA, clave: `nueva-${siguienteClave.current}`, editando: true },
    ]);
  }

  function eliminarFila(clave: string) {
    setFilas((actuales) => actuales.filter((fila) => fila.clave !== clave));
  }

  return (
    <section
      aria-labelledby="titulo-franjas"
      className="rounded-xl bg-surface-container-lowest p-6 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2
            id="titulo-franjas"
            className="flex items-center gap-3 text-xl font-semibold tracking-tight"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-on-primary">
              <Clock className="h-4 w-4" aria-hidden="true" />
            </span>
            Franjas de atención ambulatoria
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Ingresá los días y horarios en los que vas a atender durante el mes.
          </p>
        </div>
        <label className="flex min-w-48 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Mes
          <select
            value={mes}
            onChange={(e) => router.push(`?mes=${e.target.value}`)}
            className="h-10 rounded border-0 bg-surface-container-low px-3 text-sm font-semibold normal-case tracking-normal text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            {meses.map((m) => (
              <option key={m.valor} value={m.valor}>
                {m.etiqueta}
              </option>
            ))}
          </select>
        </label>
      </div>

      {bloqueado ? (
        <div
          role="status"
          className="mt-5 rounded-lg bg-surface-container-low px-4 py-6 text-center text-sm font-medium text-on-surface-variant"
        >
          {MSG_SIN_DURACION} para poder cargar tus franjas.
        </div>
      ) : (
        <form action={formAction} className="mt-5 flex flex-col gap-4">
          <input type="hidden" name="mes" value={mes} />
          <input
            type="hidden"
            name="franjas"
            value={JSON.stringify(
              filas.map(({ diaSemana, inicio, fin }) => ({ diaSemana, inicio, fin })),
            )}
          />

          {precargadoDe && (
            <p
              role="status"
              className="rounded-lg bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant"
            >
              Este mes no tiene franjas. Precargamos el patrón de {precargadoDe}{" "}
              para que lo ajustes; no se guarda hasta que confirmes.
            </p>
          )}

          {state.errors._form && (
            <div
              role="alert"
              className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
            >
              {state.errors._form}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
                  <th scope="col" className="px-4 py-3">Día de la semana</th>
                  <th scope="col" className="px-4 py-3">Hora de inicio</th>
                  <th scope="col" className="px-4 py-3">Hora de fin</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filas.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-on-surface-variant">
                      Todavía no hay franjas para este mes. Usá “Agregar franja”.
                    </td>
                  </tr>
                )}
                {filas.map((fila, indice) => (
                  <FilaFranjaEditor
                    key={fila.clave}
                    fila={fila}
                    error={errores[indice]}
                    duracionTurnoMin={duracionTurnoMin}
                    onCambiar={(cambios) => actualizarFila(fila.clave, cambios)}
                    onEliminar={() => eliminarFila(fila.clave)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <button
              type="button"
              onClick={agregarFila}
              className="inline-flex h-10 items-center gap-2 rounded bg-surface-container-low px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Agregar franja
            </button>
          </div>

          <div className="flex flex-col gap-3 rounded-lg bg-surface-container-low px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-on-surface-variant">
              Los cambios impactarán en la reserva de turnos de tus pacientes al
              guardarse.
            </p>
            <button
              type="submit"
              disabled={pending || hayErrores || filas.length === 0}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:opacity-60"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {pending ? "Guardando…" : "Guardar disponibilidad"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

function FilaFranjaEditor({
  fila,
  error,
  duracionTurnoMin,
  onCambiar,
  onEliminar,
}: {
  fila: FilaEditor;
  error: string | undefined;
  duracionTurnoMin: number;
  onCambiar: (cambios: Partial<FilaEditor>) => void;
  onEliminar: () => void;
}) {
  const inicioMin = parsearHora(fila.inicio);
  const finMin = parsearHora(fila.fin);
  const resumen =
    !error && inicioMin !== null && finMin !== null
      ? generarTurnos({ inicioMin, finMin }, duracionTurnoMin)
      : null;
  const etiqueta = `${etiquetaDia(fila.diaSemana)} ${fila.inicio} a ${fila.fin}`;
  const claseInput =
    "h-9 rounded border-0 bg-surface-container-low px-2 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40";

  return (
    <>
      <tr className={`border-t border-surface-container-high ${error ? "bg-surface-container-low" : ""}`}>
        <td className="px-4 py-3">
          {fila.editando ? (
            <select
              aria-label="Día de la semana"
              value={fila.diaSemana}
              onChange={(e) => onCambiar({ diaSemana: Number(e.target.value) as DiaSemana })}
              className={claseInput}
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.valor} value={d.valor}>
                  {d.etiqueta}
                </option>
              ))}
            </select>
          ) : (
            <span className="flex items-center gap-2 font-medium">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-primary" />
              {etiquetaDia(fila.diaSemana)}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          {fila.editando ? (
            <input
              type="time"
              aria-label="Hora de inicio"
              step={PASO_MINUTOS * 60}
              value={fila.inicio}
              onChange={(e) => onCambiar({ inicio: e.target.value })}
              className={claseInput}
            />
          ) : (
            <span className="font-mono tabular-nums">{fila.inicio}</span>
          )}
        </td>
        <td className="px-4 py-3">
          {fila.editando ? (
            <input
              type="time"
              aria-label="Hora de fin"
              step={PASO_MINUTOS * 60}
              value={fila.fin}
              onChange={(e) => onCambiar({ fin: e.target.value })}
              className={claseInput}
            />
          ) : (
            <span className="font-mono tabular-nums">{fila.fin}</span>
          )}
          {resumen && (
            <span className="mt-1 block text-xs text-on-surface-variant">
              {resumen.turnos.length} turno{resumen.turnos.length === 1 ? "" : "s"}
              {resumen.sobranteMin > 0 && ` · quedan ${resumen.sobranteMin} min sin turno`}
            </span>
          )}
        </td>
        <td className="px-4 py-3">
          <div className="flex justify-end gap-2">
            {fila.editando ? (
              <button
                type="button"
                onClick={() => onCambiar({ editando: false })}
                disabled={Boolean(error)}
                aria-label={`Confirmar ${etiqueta}`}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-surface-container-low px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                Listo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onCambiar({ editando: true })}
                aria-label={`Editar ${etiqueta}`}
                className="inline-flex h-8 items-center gap-1.5 rounded bg-surface-container-low px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Editar
              </button>
            )}
            <button
              type="button"
              onClick={onEliminar}
              aria-label={`Eliminar ${etiqueta}`}
              className="inline-flex h-8 items-center gap-1.5 rounded bg-surface-container-low px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              Eliminar
            </button>
          </div>
        </td>
      </tr>
      {error && (
        <tr>
          <td colSpan={4} className="px-1 pb-2">
            <p
              role="alert"
              className="flex items-center gap-2 rounded bg-primary px-3 py-2 text-xs font-semibold text-on-primary"
            >
              <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
              {error}
            </p>
          </td>
        </tr>
      )}
    </>
  );
}

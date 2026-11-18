"use client";

import { useState } from "react";
import { useActionState } from "react";
import { TriangleAlert } from "lucide-react";
import { ESTADO_INICIAL } from "@/lib/form-state";
import {
  cancelarTurnoDeVacunacion,
  registrarAusenciaVacunacion,
  registrarVacunaAplicada,
} from "./actions";

type TipoModal = "cancelar" | "aplicar" | "ausente" | null;

/**
 * Acciones de una fila de la lista de turnos de vacunación (US-34):
 * - "Cancelar" (US-35) en turnos futuros reservados;
 * - "Vacuna aplicada" y "Ausente" (US-60) en turnos reservados de hoy o de
 *   días anteriores.
 * Al confirmar, el server action revalida las listas y Next refresca la ruta;
 * el modal se cierra porque el estado devuelve `ok`.
 */
export function AccionesTurnoVacunacion({
  turnoId,
  nombrePaciente,
  dni,
  vacuna,
  fechaEtiqueta,
  cancelable,
  puedeCerrar,
}: {
  turnoId: string;
  nombrePaciente: string;
  dni: string | null;
  vacuna: string;
  fechaEtiqueta: string;
  cancelable: boolean;
  puedeCerrar: boolean;
}) {
  const [modal, setModal] = useState<TipoModal>(null);

  const [estadoCancelar, cancelarAction, cancelarPending] = useActionState(
    cancelarTurnoDeVacunacion,
    ESTADO_INICIAL,
  );
  const [estadoAplicar, aplicarAction, aplicarPending] = useActionState(
    registrarVacunaAplicada,
    ESTADO_INICIAL,
  );
  const [estadoAusente, ausenteAction, ausentePending] = useActionState(
    registrarAusenciaVacunacion,
    ESTADO_INICIAL,
  );

  const exitoCancelar = Boolean(estadoCancelar.values?.ok);
  const exitoAplicar = Boolean(estadoAplicar.values?.ok);
  const exitoAusente = Boolean(estadoAusente.values?.ok);

  if (!cancelable && !puedeCerrar) {
    return null;
  }

  const datosPaciente = dni ? `${nombrePaciente} (DNI ${dni})` : nombrePaciente;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {puedeCerrar && (
          <button
            type="button"
            onClick={() => setModal("aplicar")}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-green-100 px-3 text-xs font-semibold text-green-800 transition-colors hover:bg-green-200"
          >
            <span className="material-symbols-outlined text-[16px]">vaccines</span>
            Vacuna aplicada
          </button>
        )}
        {puedeCerrar && (
          <button
            type="button"
            onClick={() => setModal("ausente")}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-red-100 px-3 text-xs font-semibold text-red-800 transition-colors hover:bg-red-200"
          >
            <span className="material-symbols-outlined text-[16px]">person_off</span>
            Ausente
          </button>
        )}
        {cancelable && (
          <button
            type="button"
            onClick={() => setModal("cancelar")}
            className="inline-flex h-8 items-center gap-1.5 rounded bg-surface-container-high px-3 text-xs font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            Cancelar
          </button>
        )}
      </div>

      {modal === "cancelar" && !exitoCancelar && (
        <ModalShell
          titulo="Cancelar turno de vacunación"
          icono="event_busy"
          onClose={() => setModal(null)}
        >
          <form action={cancelarAction} className="flex flex-col gap-4 p-5">
            <input type="hidden" name="turnoId" value={turnoId} />
            {estadoCancelar.errors._form && <Alerta texto={estadoCancelar.errors._form} />}
            <p className="text-sm font-semibold text-on-surface">
              ¿Cancelar el turno de vacunación de {nombrePaciente}?
            </p>
            <Nota texto="El horario queda libre y la dosis vuelve al stock." />
            <DetallesTurno fechaEtiqueta={fechaEtiqueta} paciente={datosPaciente} vacuna={vacuna} />
            <Acciones onClose={() => setModal(null)} pending={cancelarPending} confirmar="Cancelar turno" peligroso />
          </form>
        </ModalShell>
      )}

      {modal === "aplicar" && !exitoAplicar && (
        <ModalShell
          titulo="Confirmar aplicación de vacuna"
          icono="vaccines"
          onClose={() => setModal(null)}
        >
          <form action={aplicarAction} className="flex flex-col gap-4 p-5">
            <input type="hidden" name="turnoId" value={turnoId} />
            {estadoAplicar.errors._form && <Alerta texto={estadoAplicar.errors._form} />}
            <p className="text-sm font-semibold text-on-surface">
              ¿Confirmar que se aplicó la {vacuna} a {nombrePaciente}?
            </p>
            <Nota texto="La dosis fue descontada previamente al reservar el turno. Registrar la aplicación no descuenta stock adicional." />
            <DetallesTurno fechaEtiqueta={fechaEtiqueta} paciente={datosPaciente} vacuna={vacuna} />
            <Acciones onClose={() => setModal(null)} pending={aplicarPending} confirmar="Confirmar" />
          </form>
        </ModalShell>
      )}

      {modal === "ausente" && !exitoAusente && (
        <ModalShell titulo="Registrar ausencia" icono="person_off" onClose={() => setModal(null)}>
          <form action={ausenteAction} className="flex flex-col gap-4 p-5">
            <input type="hidden" name="turnoId" value={turnoId} />
            {estadoAusente.errors._form && <Alerta texto={estadoAusente.errors._form} />}
            <p className="text-sm font-semibold text-on-surface">
              ¿Marcar a {nombrePaciente} como ausente?
            </p>
            <Nota texto="La dosis vuelve al stock." />
            <DetallesTurno fechaEtiqueta={fechaEtiqueta} paciente={datosPaciente} vacuna={vacuna} />
            <Acciones onClose={() => setModal(null)} pending={ausentePending} confirmar="Confirmar" peligroso />
          </form>
        </ModalShell>
      )}
    </>
  );
}

function ModalShell({
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
      aria-label={titulo}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-xl">
        <div className="flex items-center justify-between bg-surface-container-low px-5 py-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-on-surface">{icono}</span>
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

function DetallesTurno({
  fechaEtiqueta,
  paciente,
  vacuna,
}: {
  fechaEtiqueta: string;
  paciente: string;
  vacuna: string;
}) {
  return (
    <dl className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4 text-sm">
      <Fila etiqueta="Fecha y hora" valor={fechaEtiqueta} />
      <Fila etiqueta="Paciente" valor={paciente} />
      <Fila etiqueta="Vacuna" valor={vacuna} />
    </dl>
  );
}

function Nota({ texto }: { texto: string }) {
  return (
    <p className="rounded-lg bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
      {texto}
    </p>
  );
}

function Acciones({
  onClose,
  pending,
  confirmar,
  peligroso = false,
}: {
  onClose: () => void;
  pending: boolean;
  confirmar: string;
  peligroso?: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
      >
        Volver
      </button>
      <button
        type="submit"
        disabled={pending}
        className={`inline-flex h-10 items-center justify-center gap-1 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          peligroso
            ? "bg-error text-on-error hover:opacity-90"
            : "bg-primary text-on-primary hover:bg-secondary"
        }`}
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
      className="flex items-start gap-2 rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {texto}
    </div>
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

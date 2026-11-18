"use client";

import { CircleCheck, RefreshCw, TriangleAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { ESTADO_INICIAL } from "@/lib/form-state";
import { confirmarAsignacion } from "./actions";

/**
 * Botón "Confirmar" de la asignación (US-33). Si el horario o el stock ya no
 * están disponibles, muestra el aviso con "Actualizar disponibilidad".
 */
export function ConfirmarAsignacionForm({
  pacienteId,
  vacunaId,
  fecha,
  inicioMin,
}: {
  pacienteId: string;
  vacunaId: string;
  fecha: string;
  inicioMin: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(confirmarAsignacion, ESTADO_INICIAL);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="pacienteId" value={pacienteId} />
      <input type="hidden" name="vacunaId" value={vacunaId} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="inicioMin" value={inicioMin} />

      {state.errors._form && (
        <div role="alert" className="flex flex-col gap-3 rounded-lg bg-surface-container-high p-4 text-sm">
          <p className="flex items-start gap-2 font-semibold text-on-surface">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {state.errors._form}
          </p>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex h-9 items-center justify-center gap-2 self-start rounded bg-surface-container-lowest px-3 text-xs font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
            Actualizar disponibilidad
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-12 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:opacity-60"
      >
        <CircleCheck className="h-4 w-4" aria-hidden="true" />
        {pending ? "Asignando…" : "Confirmar"}
      </button>
    </form>
  );
}

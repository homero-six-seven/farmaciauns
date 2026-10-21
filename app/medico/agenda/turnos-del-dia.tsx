import {
  etiquetaFechaLarga,
  formatearHora,
  generarTurnos,
  type FechaISO,
} from "@/lib/domain/agenda";
import type { FranjaGuardada } from "@/lib/agenda-repository";

/**
 * Detalle del día seleccionado en "Mi agenda" (US-27, CA2): franjas del día y
 * sus turnos con horario de inicio y fin.
 * Mientras no existan reservas, todos los turnos de hoy en adelante están
 * "Disponible"; los de días pasados se muestran atenuados y sin estado.
 */
export function TurnosDelDia({
  fecha,
  hoy,
  franjas,
}: {
  fecha: FechaISO;
  hoy: FechaISO;
  franjas: FranjaGuardada[];
}) {
  const esHoy = fecha === hoy;
  const pasado = fecha < hoy;
  const turnos = franjas.flatMap((f) =>
    generarTurnos(f, f.duracionTurnoMin).turnos.map((t) => ({
      ...t,
      duracionTurnoMin: f.duracionTurnoMin,
    })),
  );
  const descripcionFranjas = franjas
    .map(
      (f) =>
        `${formatearHora(f.inicioMin)} a ${formatearHora(f.finMin)} hs · ${f.duracionTurnoMin} min / turno`,
    )
    .join("  |  ");

  return (
    <section
      id={`dia-${fecha}`}
      aria-labelledby={`titulo-${fecha}`}
      className={`overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm ${
        pasado ? "opacity-60" : ""
      }`}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-container-high bg-surface-container-low px-5 py-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded text-sm font-bold tabular-nums ${
              esHoy ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface"
            }`}
          >
            {fecha.slice(8)}
          </span>
          <div>
            <h3 id={`titulo-${fecha}`} className="flex items-center gap-2 font-semibold">
              {etiquetaFechaLarga(fecha)}
              {esHoy && (
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                  Hoy
                </span>
              )}
              {pasado && (
                <span className="rounded bg-surface-container-high px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                  Pasado
                </span>
              )}
            </h3>
            <p className="text-xs font-medium text-on-surface-variant">
              Franja horaria: {descripcionFranjas}
            </p>
          </div>
        </div>
        <span className="rounded bg-surface-container-lowest px-3 py-1 text-xs font-semibold text-on-surface">
          {turnos.length} turno{turnos.length === 1 ? "" : "s"}
        </span>
      </header>

      <ul className="flex flex-col gap-2 p-4">
        {turnos.map((turno) => (
          <li
            key={turno.inicioMin}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed border-outline-variant px-4 py-2.5"
          >
            <div className="flex items-center gap-4">
              {/* US-27: horario de inicio y fin de cada turno. */}
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatearHora(turno.inicioMin)} – {formatearHora(turno.finMin)}
              </span>
              <span className="text-xs text-on-surface-variant">
                {turno.duracionTurnoMin} min ·{" "}
                <span className="italic">
                  {pasado ? "Turno de un día pasado" : "Turno disponible para reserva"}
                </span>
              </span>
            </div>
            {!pasado && (
              <span className="inline-flex items-center gap-1.5 rounded border border-outline-variant px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-on-surface">
                <span aria-hidden="true" className="h-2 w-2 rounded-full border border-on-surface" />
                Disponible
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

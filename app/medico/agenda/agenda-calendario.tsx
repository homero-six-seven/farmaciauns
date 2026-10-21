import Link from "next/link";
import {
  DIAS_SEMANA,
  diaSemanaDe,
  diasDelMes,
  formatearMes,
  type FechaISO,
  type MesAgenda,
} from "@/lib/domain/agenda";

/**
 * Calendario mensual de "Mi agenda" (US-27): marca los días con turnos y hoy.
 * Al seleccionar un día con turnos (`?dia=YYYY-MM-DD`), la página muestra la
 * lista de turnos de ese día (CA2).
 */
export function AgendaCalendario({
  mes,
  hoy,
  diasConTurnos,
  seleccionado,
}: {
  mes: MesAgenda;
  hoy: FechaISO;
  diasConTurnos: Set<FechaISO>;
  seleccionado: FechaISO | null;
}) {
  const dias = diasDelMes(mes);
  // Celdas vacías antes del día 1 para que la semana arranque en lunes.
  const huecos = diaSemanaDe(dias[0]) - 1;

  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
        {DIAS_SEMANA.map((d) => (
          <span key={d.valor} className="py-1" aria-hidden="true">
            {d.etiqueta.slice(0, 2)}
          </span>
        ))}
      </div>
      <ol className="grid grid-cols-7 gap-1" aria-label="Días del mes">
        {Array.from({ length: huecos }, (_, i) => (
          <li key={`hueco-${i}`} aria-hidden="true" />
        ))}
        {dias.map((fecha) => {
          const numero = Number(fecha.slice(8));
          const habilitado = diasConTurnos.has(fecha);
          const pasado = fecha < hoy;
          const esHoy = fecha === hoy;
          const esSeleccionado = fecha === seleccionado;
          const base =
            "relative flex h-10 items-center justify-center rounded text-sm font-semibold tabular-nums";
          // Punto debajo del número para marcar hoy.
          const marcaHoy = esHoy && (
            <span
              aria-hidden="true"
              className="absolute bottom-1 h-1 w-1 rounded-full bg-current"
            />
          );

          return (
            <li key={fecha}>
              {habilitado ? (
                <Link
                  href={`?mes=${formatearMes(mes)}&dia=${fecha}`}
                  scroll={false}
                  aria-current={esSeleccionado ? "date" : undefined}
                  aria-label={`Día ${numero}, con turnos${esHoy ? ", hoy" : ""}`}
                  className={`${base} transition-opacity hover:opacity-80 ${
                    pasado
                      ? "bg-surface-container-high text-on-surface-variant"
                      : "bg-primary text-on-primary"
                  } ${esSeleccionado ? "ring-2 ring-primary ring-offset-2" : ""}`}
                >
                  {numero}
                  {marcaHoy}
                </Link>
              ) : (
                <span
                  aria-label={`Día ${numero}, sin turnos${esHoy ? ", hoy" : ""}`}
                  className={`${base} font-normal ${
                    pasado ? "text-outline-variant" : "text-on-surface-variant"
                  }`}
                >
                  {numero}
                  {marcaHoy}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-primary" />
          Con turnos
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm ring-2 ring-primary ring-offset-1" />
          Seleccionado
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-on-surface-variant" />
          Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-surface-container-high" />
          Día pasado
        </span>
      </div>
      <p className="mt-3 text-xs text-on-surface-variant">
        Tocá un día con turnos para ver su detalle.
      </p>
    </div>
  );
}

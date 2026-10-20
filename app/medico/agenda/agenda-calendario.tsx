import {
  DIAS_SEMANA,
  diaSemanaDe,
  diasDelMes,
  type FechaISO,
  type MesAgenda,
} from "@/lib/domain/agenda";

/**
 * Calendario mensual de "Mi agenda" (US-27): marca los días con atención y
 * hoy. Cada día habilitado lleva a su detalle de turnos en la misma página.
 */
export function AgendaCalendario({
  mes,
  hoy,
  diasConTurnos,
}: {
  mes: MesAgenda;
  hoy: FechaISO;
  diasConTurnos: Set<FechaISO>;
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
          const base = `flex h-10 items-center justify-center rounded text-sm font-semibold tabular-nums ${
            esHoy ? "ring-2 ring-primary ring-offset-1" : ""
          }`;

          return (
            <li key={fecha}>
              {habilitado ? (
                <a
                  href={`#dia-${fecha}`}
                  aria-label={`Día ${numero}, con turnos${esHoy ? ", hoy" : ""}`}
                  className={`${base} transition-opacity hover:opacity-80 ${
                    pasado
                      ? "bg-surface-container-high text-on-surface-variant"
                      : "bg-primary text-on-primary"
                  }`}
                >
                  {numero}
                </a>
              ) : (
                <span
                  aria-label={`Día ${numero}, sin turnos${esHoy ? ", hoy" : ""}`}
                  className={`${base} font-normal ${
                    pasado ? "text-outline-variant" : "text-on-surface-variant"
                  }`}
                >
                  {numero}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex flex-wrap gap-4 text-xs text-on-surface-variant">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-primary" />
          Con turnos
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm ring-2 ring-primary" />
          Hoy
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="h-3 w-3 rounded-sm bg-surface-container-high" />
          Día pasado
        </span>
      </div>
    </div>
  );
}

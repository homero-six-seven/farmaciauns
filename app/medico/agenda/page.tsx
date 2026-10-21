import Link from "next/link";
import { CalendarX2, Settings } from "lucide-react";
import {
  elegirDiaVisible,
  esMesHabilitado,
  etiquetaMes,
  formatearMes,
  generarTurnos,
  hoyEnArgentina,
  mesDeFecha,
  mesesHabilitados,
  parsearMes,
  rangoDelMes,
  type FechaISO,
} from "@/lib/domain/agenda";
import { listarFranjas, type FranjaGuardada } from "@/lib/agenda-repository";
import { requireMedico } from "@/lib/authorization";
import { AgendaCalendario } from "./agenda-calendario";
import { SelectorMes } from "./selector-mes";
import { TurnosDelDia } from "./turnos-del-dia";

export const dynamic = "force-dynamic";

/**
 * US-27 (RF-01) — "Mi agenda": calendario del mes con los días habilitados y
 * la lista de turnos del día seleccionado, en estado "Disponible"
 * (`?mes=YYYY-MM&dia=YYYY-MM-DD`).
 */
export default async function MiAgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; dia?: string }>;
}) {
  const medico = await requireMedico();
  const { mes: mesParam, dia: diaParam } = await searchParams;

  const hoy = hoyEnArgentina(new Date());
  const mesPedido = mesParam ? parsearMes(mesParam) : null;
  const mes =
    mesPedido && esMesHabilitado(mesPedido, hoy) ? mesPedido : mesDeFecha(hoy);

  const franjas = await listarFranjas(medico.id, rangoDelMes(mes));
  const franjasPorDia = new Map<FechaISO, FranjaGuardada[]>();
  for (const franja of franjas) {
    franjasPorDia.set(franja.fecha, [...(franjasPorDia.get(franja.fecha) ?? []), franja]);
  }

  const turnosDisponibles = franjas
    .filter((f) => f.fecha >= hoy)
    .reduce((total, f) => total + generarTurnos(f, f.duracionTurnoMin).turnos.length, 0);
  const diasDisponibles = [...franjasPorDia.keys()].filter((fecha) => fecha >= hoy).length;
  const diaVisible = elegirDiaVisible([...franjasPorDia.keys()], hoy, diaParam);
  const urlDisponibilidad = `/medico/agenda/disponibilidad?mes=${formatearMes(mes)}`;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span>Agenda médica</span>
            <span className="text-outline">/</span>
            <span className="text-on-surface">Turnos programados</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Mi agenda</h1>
          <p className="mt-1 text-on-surface-variant">
            Días de atención y turnos habilitados del mes.
          </p>
        </div>
        <Link
          href={urlDisponibilidad}
          className="inline-flex h-10 items-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          {/* US-28: desde un mes con disponibilidad cargada se "modifica". */}
          {franjas.length > 0 ? "Modificar disponibilidad" : "Cargar disponibilidad"}
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <SelectorMes
          mes={formatearMes(mes)}
          meses={mesesHabilitados(hoy).map((m) => ({
            valor: formatearMes(m),
            etiqueta: etiquetaMes(m),
          }))}
        />
        {franjas.length > 0 && (
          <p className="text-sm text-on-surface-variant">
            <span className="font-semibold text-on-surface">{turnosDisponibles}</span>{" "}
            turno{turnosDisponibles === 1 ? "" : "s"} disponible
            {turnosDisponibles === 1 ? "" : "s"} en{" "}
            <span className="font-semibold text-on-surface">{diasDisponibles}</span>{" "}
            día{diasDisponibles === 1 ? "" : "s"}
            {mes.anio === mesDeFecha(hoy).anio && mes.mes === mesDeFecha(hoy).mes
              ? ", de hoy en adelante"
              : ""}
          </p>
        )}
      </div>

      {franjas.length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant">
            <CalendarX2 className="h-6 w-6" aria-hidden="true" />
          </span>
          {/* Texto y botón exactos del CA3 de US-27. */}
          <h2 className="text-lg font-semibold">No cargaste disponibilidad para este mes</h2>
          <p className="mt-1 max-w-md text-sm text-on-surface-variant">
            {etiquetaMes(mes)} todavía no tiene turnos habilitados.
          </p>
          <Link
            href={urlDisponibilidad}
            className="mt-5 inline-flex h-10 items-center rounded bg-surface-container-low px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
          >
            Cargar disponibilidad
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <aside className="rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:sticky lg:top-16">
            <h2 className="mb-3 text-sm font-semibold">{etiquetaMes(mes)}</h2>
            <AgendaCalendario
              mes={mes}
              hoy={hoy}
              diasConTurnos={new Set(franjasPorDia.keys())}
              seleccionado={diaVisible}
            />
          </aside>
          <div className="min-w-0">
            {diaVisible && (
              <TurnosDelDia
                fecha={diaVisible}
                hoy={hoy}
                franjas={franjasPorDia.get(diaVisible) ?? []}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

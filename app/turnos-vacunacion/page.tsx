import Link from "next/link";
import { requireRole } from "@/lib/authorization";
import {
  diaSemanaDe,
  etiquetaDia,
  formatearHora,
  hoyEnArgentina,
} from "@/lib/domain/agenda";
import { etiquetaEstado, formatearFecha } from "@/lib/domain/turno";
import {
  MSG_SIN_TURNOS_VACUNACION,
  esFechaISO,
  sumarDias,
} from "@/lib/domain/vacunacion";
import { listarTurnosVacunacion } from "@/lib/vacunacion-service";

export const dynamic = "force-dynamic";

const ESTILOS_ESTADO: Record<string, string> = {
  RESERVADO: "bg-surface-container-high text-on-surface",
  ATENDIDO: "bg-green-100 text-green-800",
  AUSENTE: "bg-red-100 text-red-800",
  CANCELADO: "bg-surface-container-highest text-on-surface-variant",
};

/**
 * US-34 (RF-04b) — Turnos de vacunación del día (acceso EXCLUSIVO para
 * Enfermera). Por defecto muestra el día actual, ordenado por hora, con
 * paciente, DNI, vacuna y estado. Se puede cambiar de día (flechas, "Hoy" y
 * selector de fecha) y desde acá se asignan (US-33), cancelan (US-35) y
 * cierran (US-60) los turnos.
 */
export default async function TurnosVacunacionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>;
}) {
  await requireRole(["enfermera"]);

  const { fecha } = await searchParams;
  const hoy = hoyEnArgentina(new Date());
  const fechaSeleccionada = fecha && esFechaISO(fecha) ? fecha : hoy;

  const turnos = await listarTurnosVacunacion(fechaSeleccionada);
  const atendidos = turnos.filter((t) => t.estado === "ATENDIDO").length;
  const pendientes = turnos.filter((t) => t.estado === "RESERVADO").length;
  const etiquetaFecha = `${etiquetaDia(diaSemanaDe(fechaSeleccionada))} ${formatearFecha(fechaSeleccionada)}`;

  return (
    <div className="mx-auto flex max-w-5xl flex-col">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <Link
              href="/inicio"
              className="text-on-surface-variant transition-colors hover:text-on-surface"
            >
              Inicio
            </Link>
            <span className="text-outline">/</span>
            <span className="text-on-surface">Turnos de vacunación</span>
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            Turnos de vacunación
          </h1>
          <p className="mt-1 text-on-surface-variant">
            Gestión y seguimiento de turnos para aplicación de biológicos en
            vacunatorio.
          </p>
        </div>
        <Link
          href="/turnos-vacunacion/asignar"
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Asignar turno
        </Link>
      </div>

      {/* Resumen del día */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Atendidos
          </span>
          <p className="mt-2 text-3xl font-bold leading-none text-on-surface">
            {atendidos}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Pendientes
          </span>
          <p className="mt-2 text-3xl font-bold leading-none text-on-surface">
            {pendientes}
          </p>
        </div>
        <div className="rounded-xl bg-surface-container-lowest p-5 shadow-sm">
          <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Turnos del día
          </span>
          <p className="mt-2 text-3xl font-bold leading-none text-on-surface">
            {turnos.length}
          </p>
        </div>
      </div>

      {/* Navegación de día */}
      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm">
        <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          Fecha:
        </span>
        <Link
          href={`/turnos-vacunacion?fecha=${sumarDias(fechaSeleccionada, -1)}`}
          aria-label="Día anterior"
          className="flex h-9 w-9 items-center justify-center rounded bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </Link>
        <span className="min-w-40 text-center text-sm font-semibold text-on-surface">
          {etiquetaFecha}
        </span>
        <Link
          href={`/turnos-vacunacion?fecha=${sumarDias(fechaSeleccionada, 1)}`}
          aria-label="Día siguiente"
          className="flex h-9 w-9 items-center justify-center rounded bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest"
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </Link>
        {fechaSeleccionada !== hoy && (
          <Link
            href="/turnos-vacunacion"
            className="inline-flex h-9 items-center rounded bg-surface-container-high px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-highest"
          >
            Hoy
          </Link>
        )}
        <form
          method="GET"
          action="/turnos-vacunacion"
          className="ml-auto flex items-center gap-2"
        >
          <label htmlFor="fecha-vacunacion" className="sr-only">
            Ir a la fecha
          </label>
          <input
            id="fecha-vacunacion"
            name="fecha"
            type="date"
            defaultValue={fechaSeleccionada}
            className="h-10 rounded bg-surface px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded bg-surface-container-low px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
          >
            Ir
          </button>
        </form>
      </div>

      {/* Tabla del día */}
      {turnos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-12 text-center shadow-sm">
          <span className="material-symbols-outlined mb-4 text-[40px] text-outline">
            event_busy
          </span>
          <p className="text-sm font-medium text-on-surface-variant">
            {MSG_SIN_TURNOS_VACUNACION}
          </p>
        </div>
      ) : (
        <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-4 py-2.5" scope="col">
                    Hora
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    Paciente
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    DNI
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    Vacuna
                  </th>
                  <th className="px-4 py-2.5" scope="col">
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((t) => (
                  <tr
                    key={t.id}
                    className="border-t border-surface-container-high transition-colors hover:bg-surface-container-low"
                  >
                    <td className="px-4 py-3 font-mono text-on-surface">
                      {formatearHora(t.inicioMin)} hs
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {t.paciente.nombreCompleto}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {t.paciente.dni ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-on-surface">{t.vacuna}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${ESTILOS_ESTADO[t.estado] ?? "bg-surface-container-highest text-on-surface-variant"}`}
                      >
                        {etiquetaEstado(t.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-surface-container-high bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
            Mostrando {turnos.length} de {turnos.length} turnos registrados
          </div>
        </section>
      )}
    </div>
  );
}

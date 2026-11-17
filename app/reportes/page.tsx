import Link from "next/link";
import {
  CalendarDays,
  ChartColumn,
  CircleAlert,
  ClipboardList,
  CreditCard,
  Syringe,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { hoyEnArgentina, mesDeFecha, rangoDelMes } from "@/lib/domain/agenda";
import { formatearPorcentajeAsistencia } from "@/lib/domain/reporte-asistencia";
import {
  ETIQUETA_MEDIO_PAGO,
  MEDIOS_PAGO_REPORTE,
  MSG_SIN_PAGOS,
  formatearImporte,
} from "@/lib/domain/reporte-pagos";
import { ETIQUETA_STOCK_BAJO, LIMITE_STOCK_BAJO } from "@/lib/domain/reporte-stock";
import { validarRangoReporte } from "@/lib/domain/reporte-turnos";
import { formatearFecha, momentoEnArgentina } from "@/lib/domain/turno";
import { generarReporteAsistencia } from "@/lib/reporte-asistencia-service";
import { generarReportePagos } from "@/lib/reporte-pagos-service";
import { generarReporteStockVacunas } from "@/lib/reporte-stock-service";
import { generarReporteTurnosPorEspecialidad } from "@/lib/reporte-turnos-service";

export const dynamic = "force-dynamic";

type TipoReporte = "turnos" | "stock" | "pagos" | "asistencia";

type Parametros = {
  tipo?: string | string[];
  desde?: string | string[];
  hasta?: string | string[];
};

type Pestana = {
  etiqueta: string;
  icono: LucideIcon;
  tipo?: TipoReporte;
};

const PESTANAS: Pestana[] = [
  { etiqueta: "Turnos por especialidad", icono: ChartColumn, tipo: "turnos" },
  { etiqueta: "Stock de vacunas", icono: Syringe, tipo: "stock" },
  { etiqueta: "Pagos", icono: CreditCard, tipo: "pagos" },
  { etiqueta: "Asistencia", icono: UsersRound, tipo: "asistencia" },
];

function primerValor(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function dosDigitos(valor: number): string {
  return String(valor).padStart(2, "0");
}

function hrefReporte(tipo: TipoReporte, desde: string, hasta: string): string {
  const parametros = new URLSearchParams({ tipo, desde, hasta });
  return `/reportes?${parametros.toString()}`;
}

function clasePestana(activa: boolean, habilitada: boolean): string {
  if (!habilitada) {
    return "cursor-not-allowed bg-surface-container text-on-surface-variant opacity-60";
  }
  return activa
    ? "bg-primary text-on-primary"
    : "bg-surface-container text-on-surface hover:bg-surface-container-high";
}

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  const params = await searchParams;
  const tipoParam = primerValor(params.tipo);
  const tipo: TipoReporte =
    tipoParam === "stock" || tipoParam === "pagos" || tipoParam === "asistencia"
      ? tipoParam
      : "turnos";
  const desdeParam = primerValor(params.desde);
  const hastaParam = primerValor(params.hasta);
  const ahora = new Date();
  const porDefecto = rangoDelMes(mesDeFecha(hoyEnArgentina(ahora)));
  const resultado =
    desdeParam || hastaParam
      ? validarRangoReporte(desdeParam, hastaParam)
      : { valido: true as const, desde: porDefecto.desde, hasta: porDefecto.hasta };
  const error = resultado.valido ? null : resultado.error;
  const desdeHref = resultado.valido ? resultado.desde : desdeParam ?? porDefecto.desde;
  const hastaHref = resultado.valido ? resultado.hasta : hastaParam ?? porDefecto.hasta;
  const reporteTurnos =
    resultado.valido && tipo === "turnos"
      ? await generarReporteTurnosPorEspecialidad(resultado.desde, resultado.hasta)
      : null;
  const reporteStock =
    resultado.valido && tipo === "stock"
      ? await generarReporteStockVacunas(resultado.desde, resultado.hasta)
      : null;
  const reportePagos =
    resultado.valido && tipo === "pagos"
      ? await generarReportePagos(resultado.desde, resultado.hasta)
      : null;
  const reporteAsistencia =
    resultado.valido && tipo === "asistencia"
      ? await generarReporteAsistencia(resultado.desde, resultado.hasta)
      : null;
  const momento = momentoEnArgentina(ahora);
  const emitido = `${formatearFecha(momento.fecha)} ${dosDigitos(Math.floor(momento.minuto / 60))}:${dosDigitos(momento.minuto % 60)}`;
  const IconoGenerar =
    tipo === "stock"
      ? Syringe
      : tipo === "pagos"
        ? CreditCard
        : tipo === "asistencia"
          ? UsersRound
          : ChartColumn;
  const moduloReporte =
    tipo === "stock"
      ? "Módulo US-44"
      : tipo === "pagos"
        ? "Módulo US-45"
        : tipo === "asistencia"
          ? "Módulo US-46"
          : null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section aria-labelledby="titulo-reportes" className="flex flex-col gap-1">
        {moduloReporte && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded bg-surface-container px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            {tipo === "stock" ? (
              <Syringe className="h-3.5 w-3.5" aria-hidden="true" />
            ) : tipo === "pagos" ? (
              <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <UsersRound className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {moduloReporte}
          </span>
        )}
        {tipo === "pagos" && (
          <span className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Gestión contable y liquidaciones
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
          Reportes
        </span>
        <h1 id="titulo-reportes" className="text-2xl font-bold tracking-tight text-on-surface">
          Reportes
        </h1>
        <p className="text-sm text-on-surface-variant">
          Métricas y reportes de gestión clínica y operativa.
        </p>
      </section>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de reporte">
        {PESTANAS.map((pestana) => {
          const Icono = pestana.icono;
          const activa = pestana.tipo === tipo;
          const habilitada = Boolean(pestana.tipo);
          const contenido = (
            <>
              <Icono className="h-4 w-4" aria-hidden="true" />
              {pestana.etiqueta}
            </>
          );
          const clase = `flex min-h-11 items-center gap-2 rounded px-4 text-sm font-medium transition-colors ${clasePestana(activa, habilitada)}`;

          if (!pestana.tipo) {
            return (
              <button
                key={pestana.etiqueta}
                type="button"
                role="tab"
                aria-selected={false}
                disabled
                className={clase}
              >
                {contenido}
              </button>
            );
          }

          return (
            <Link
              key={pestana.etiqueta}
              href={hrefReporte(pestana.tipo, desdeHref, hastaHref)}
              role="tab"
              aria-selected={activa}
              className={clase}
            >
              {contenido}
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        className="flex flex-wrap items-end gap-5 rounded-xl bg-surface-container-lowest p-5 shadow-sm"
      >
        <input type="hidden" name="tipo" value={tipo} />
        <div className="flex min-w-56 flex-col gap-1.5">
          <label htmlFor="desde" className="text-xs font-semibold uppercase tracking-wide text-on-surface">
            Desde
          </label>
          <div className="flex h-10 items-center gap-2 rounded bg-surface-container-low px-3 focus-within:ring-2 focus-within:ring-primary/40">
            <CalendarDays className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
            <input
              type="date"
              id="desde"
              name="desde"
              required
              defaultValue={desdeParam || porDefecto.desde}
              className="w-full bg-transparent text-sm text-on-surface outline-none"
            />
          </div>
        </div>
        <div className="flex min-w-56 flex-col gap-1.5">
          <label htmlFor="hasta" className="text-xs font-semibold uppercase tracking-wide text-on-surface">
            Hasta
          </label>
          <div className="flex h-10 items-center gap-2 rounded bg-surface-container-low px-3 focus-within:ring-2 focus-within:ring-primary/40">
            <CalendarDays className="h-4 w-4 shrink-0 text-on-surface-variant" aria-hidden="true" />
            <input
              type="date"
              id="hasta"
              name="hasta"
              required
              defaultValue={hastaParam || porDefecto.hasta}
              className="w-full bg-transparent text-sm text-on-surface outline-none"
            />
          </div>
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
        >
          <IconoGenerar className="h-4 w-4" aria-hidden="true" />
          Generar
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-outline bg-surface-container-low px-4 py-3 text-sm font-medium text-on-surface"
        >
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </div>
      )}

      {reporteTurnos && (
        <section aria-label="Reporte de turnos por especialidad" className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface-container-low px-5 py-3 text-sm text-on-surface-variant">
            <strong className="text-sm font-semibold tracking-wide text-on-surface">
              REPORTE DE TURNOS POR ESPECIALIDAD
            </strong>
            <span aria-hidden="true">•</span>
            <span>
              Período: {formatearFecha(reporteTurnos.desde)} al {formatearFecha(reporteTurnos.hasta)}
            </span>
            <span className="ml-auto">EMITIDO: {emitido}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-left text-sm">
              <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-4 py-3">Especialidad</th>
                  <th scope="col" className="px-4 py-3 text-right">Reservados</th>
                  <th scope="col" className="px-4 py-3 text-right">Atendidos</th>
                  <th scope="col" className="px-4 py-3 text-right">Ausentes</th>
                  <th scope="col" className="px-4 py-3 text-right">Cancelados</th>
                  <th scope="col" className="px-4 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {reporteTurnos.filas.map((fila) => (
                  <tr key={fila.especialidad} className="border-t border-surface-container-high">
                    <td className="px-4 py-3 font-medium text-on-surface">{fila.etiqueta}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.reservados}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.atendidos}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.ausentes}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.cancelados}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">{fila.total}</td>
                  </tr>
                ))}
                <tr className="border-t border-surface-container-high bg-surface-container-low font-semibold text-on-surface">
                  <td className="px-4 py-3">TOTAL GENERAL</td>
                  <td className="px-4 py-3 text-right tabular-nums">{reporteTurnos.total.reservados}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{reporteTurnos.total.atendidos}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{reporteTurnos.total.ausentes}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{reporteTurnos.total.cancelados}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{reporteTurnos.total.total}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm text-on-surface-variant">
            <span className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" aria-hidden="true" />
              Total de especialidades consultadas: <b className="text-on-surface">{reporteTurnos.filas.length}</b>
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide">ESTADO: CONSOLIDADO</span>
          </div>
        </section>
      )}

      {reporteStock && (
        <section
          aria-label="Reporte de movimiento y estado de stock de vacunas"
          className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface-container-low px-5 py-3 text-sm text-on-surface-variant">
            <strong className="text-sm font-semibold tracking-wide text-on-surface">
              REPORTE DE MOVIMIENTO Y ESTADO DE STOCK DE VACUNAS
            </strong>
            <span aria-hidden="true">•</span>
            <span>
              Período: {formatearFecha(reporteStock.desde)} al {formatearFecha(reporteStock.hasta)}
            </span>
            <span className="ml-auto">EMITIDO: {emitido}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-left text-sm">
              <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-4 py-3">Vacuna</th>
                  <th scope="col" className="px-4 py-3 text-right">Stock actual</th>
                  <th scope="col" className="px-4 py-3 text-right">Ingresos</th>
                  <th scope="col" className="px-4 py-3 text-right">Egresos</th>
                  <th scope="col" className="px-4 py-3 text-right">Turnos asignados</th>
                </tr>
              </thead>
              <tbody>
                {reporteStock.filas.map((fila) => (
                  <tr key={fila.vacunaId} className="border-t border-surface-container-high">
                    <td className="px-4 py-3 font-medium text-on-surface">{fila.nombre}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center justify-end gap-2">
                        <span className="font-mono font-semibold tabular-nums">{fila.stockActual}</span>
                        {fila.stockBajo && (
                          <span className="inline-flex items-center rounded border border-outline px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface">
                            {ETIQUETA_STOCK_BAJO}
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.ingresos}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.egresos}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.turnos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-2 px-5 py-3 text-sm text-on-surface-variant">
            <span>
              Total de biológicos auditados: <b className="text-on-surface">{reporteStock.total.biologicos}</b>
            </span>
            <span aria-hidden="true">•</span>
            <span>
              Alerta: <b className="text-on-surface">{reporteStock.total.alertas}</b> vacunas con stock bajo (≤ {LIMITE_STOCK_BAJO} unidades)
            </span>
          </div>
        </section>
      )}

      {reportePagos && (
        <section
          aria-label="Reporte de cobros y pagos realizados"
          className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
            <div className="flex flex-col gap-0.5">
              <strong className="text-base font-semibold tracking-wide text-on-surface">
                REPORTE DE COBROS Y PAGOS REALIZADOS
              </strong>
              <span>
                PERÍODO: {formatearFecha(reportePagos.desde)} AL {formatearFecha(reportePagos.hasta)}
              </span>
            </div>
            <span className="ml-auto">EMITIDO: {emitido}</span>
          </div>

          {reportePagos.sinPagos ? (
            <div
              role="status"
              className="px-5 py-10 text-center text-sm font-medium text-on-surface-variant"
            >
              {MSG_SIN_PAGOS}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 border-collapse text-left text-sm">
                <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
                  <tr>
                    <th scope="col" className="px-4 py-3">Fecha</th>
                    <th scope="col" className="px-4 py-3">Paciente</th>
                    <th scope="col" className="px-4 py-3">Médico</th>
                    <th scope="col" className="px-4 py-3 text-right">Importe</th>
                    <th scope="col" className="px-4 py-3 text-center">Medio de pago</th>
                  </tr>
                </thead>
                <tbody>
                  {reportePagos.pagos.map((pago) => (
                    <tr key={pago.id} className="border-t border-surface-container-high">
                      <td className="px-4 py-3 tabular-nums">{pago.fecha}</td>
                      <td className="px-4 py-3 font-medium text-on-surface">{pago.paciente}</td>
                      <td className="px-4 py-3">{pago.medico}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {formatearImporte(pago.importe)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center rounded border border-outline bg-surface-container px-3 py-1 text-xs font-semibold uppercase tracking-wide text-on-surface">
                          {pago.medioPagoEtiqueta}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 bg-surface-container p-4 sm:grid-cols-3 lg:grid-cols-5">
            {MEDIOS_PAGO_REPORTE.map(({ medio }) => (
              <div
                key={medio}
                className="flex min-h-20 flex-col justify-center gap-1 rounded border border-outline bg-surface-container-lowest px-3 py-2"
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                  TOTAL {ETIQUETA_MEDIO_PAGO[medio]}
                </span>
                <span className="text-lg font-semibold tabular-nums text-on-surface">
                  {formatearImporte(reportePagos.totales.porMedio[medio])}
                </span>
              </div>
            ))}
            <div className="flex min-h-20 flex-col items-end justify-center gap-1 rounded bg-primary px-4 py-2 text-on-primary sm:col-span-3 lg:col-span-1">
              <span className="text-[11px] font-semibold uppercase tracking-wide opacity-80">
                TOTAL GENERAL
              </span>
              <strong className="text-2xl tabular-nums">
                {formatearImporte(reportePagos.totales.general)}
              </strong>
            </div>
          </div>
        </section>
      )}

      {reporteAsistencia && (
        <section
          aria-label="Reporte consolidado de asistencia por profesional"
          className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-surface-container-low px-5 py-4 text-sm text-on-surface-variant">
            <div className="flex flex-col gap-0.5">
              <strong className="text-base font-semibold tracking-wide text-on-surface">
                REPORTE CONSOLIDADO DE ASISTENCIA POR PROFESIONAL
              </strong>
              <span>
                PERÍODO: {formatearFecha(reporteAsistencia.desde)} AL{" "}
                {formatearFecha(reporteAsistencia.hasta)}
              </span>
            </div>
            <span className="ml-auto">EMITIDO: {emitido}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-160 border-collapse text-left text-sm">
              <thead className="bg-surface-container text-xs uppercase tracking-wide text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Médico
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Atendidos
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    Ausentes
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    % de asistencia
                  </th>
                </tr>
              </thead>
              <tbody>
                {reporteAsistencia.filas.map((fila) => (
                  <tr key={fila.medicoId} className="border-t border-surface-container-high">
                    <td className="px-4 py-3 font-medium text-on-surface">{fila.medico}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {fila.atendidos}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{fila.ausentes}</td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span
                        className={
                          fila.porcentaje === null
                            ? "text-sm italic text-on-surface-variant"
                            : "font-semibold text-on-surface"
                        }
                      >
                        {formatearPorcentajeAsistencia(fila.porcentaje)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap justify-end gap-1 bg-surface-container-low px-5 py-3 text-sm text-on-surface-variant">
            Total de profesionales consultados:{" "}
            <b className="text-on-surface">{reporteAsistencia.totalProfesionales}</b>
          </div>
        </section>
      )}
    </div>
  );
}

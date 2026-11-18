import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Check,
  Info,
  Syringe,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { requireRole } from "@/lib/authorization";
import {
  diaSemanaDe,
  etiquetaDia,
  formatearHora,
  hoyEnArgentina,
  type FechaISO,
} from "@/lib/domain/agenda";
import { MSG_TURNO_NO_DISPONIBLE, formatearFecha, seSuperponen } from "@/lib/domain/turno";
import {
  MSG_PACIENTE_NO_ENCONTRADO,
  MSG_SIN_STOCK,
  diaHabilAnterior,
  esDiaHabilVacunacion,
  esFechaISO,
  grillaVacunacion,
  proximoDiaHabil,
} from "@/lib/domain/vacunacion";
import { listarVacunas } from "@/lib/stock-service";
import {
  buscarPacientesActivos,
  disponibilidadVacunacion,
  obtenerPacienteActivo,
  obtenerTurnoVacunacionPorId,
  type PacienteActivo,
} from "@/lib/vacunacion-service";
import { ConfirmarAsignacionForm } from "./confirmar-asignacion-form";

export const dynamic = "force-dynamic";

type Parametros = {
  q?: string;
  paciente?: string;
  vacuna?: string;
  fecha?: string;
  hora?: string;
  reservado?: string;
};

/** Arma la URL de un paso conservando solo los parámetros que siguen valiendo. */
function urlAsignacion(p: Record<string, string | number | null | undefined>): string {
  const query = new URLSearchParams();
  for (const [clave, valor] of Object.entries(p)) {
    if (valor !== undefined && valor !== null && valor !== "") {
      query.set(clave, String(valor));
    }
  }
  return `/turnos-vacunacion/asignar?${query.toString()}`;
}

/**
 * US-33 (RF-04b) — Asignar turno de vacunación, en tres pasos según los
 * wireframes: 1) paciente, 2) vacuna, 3) día y horario. El estado viaja en la
 * URL. Solo se ofrecen pacientes activos, vacunas con stock (las agotadas se
 * muestran deshabilitadas con "Sin stock") y horarios futuros libres de la
 * grilla de 15 minutos (lunes a viernes, 08:00 a 18:00).
 */
export default async function AsignarTurnoVacunacionPage({
  searchParams,
}: {
  searchParams: Promise<Parametros>;
}) {
  await requireRole(["enfermera"]);

  const params = await searchParams;
  const ahora = new Date();
  const hoy = hoyEnArgentina(ahora);
  const fechaPorDefecto = esDiaHabilVacunacion(hoy) ? hoy : proximoDiaHabil(hoy);

  if (params.reservado) {
    const turno = await obtenerTurnoVacunacionPorId(params.reservado);
    if (turno) {
      return (
        <AsignacionExitosa
          paciente={turno.paciente.nombreCompleto}
          dni={turno.paciente.dni}
          vacuna={turno.vacuna}
          fecha={turno.fecha}
          inicioMin={turno.inicioMin}
        />
      );
    }
  }

  const q = (params.q ?? "").trim();
  const resultados = q ? await buscarPacientesActivos(q) : [];
  const paciente = params.paciente ? await obtenerPacienteActivo(params.paciente) : null;

  const vacunas = await listarVacunas();
  const vacuna = params.vacuna ? (vacunas.find((v) => v.id === params.vacuna) ?? null) : null;

  const fechaValida =
    params.fecha &&
    esFechaISO(params.fecha) &&
    esDiaHabilVacunacion(params.fecha) &&
    params.fecha >= hoy
      ? params.fecha
      : null;
  const fechaSeleccionada = fechaValida ?? fechaPorDefecto;
  const { libres, ocupados } = await disponibilidadVacunacion(fechaSeleccionada, ahora);
  const grilla = grillaVacunacion(fechaSeleccionada);

  const horaPedida = params.hora ? Number(params.hora) : null;
  const horario = libres.find((h) => h.inicioMin === horaPedida) ?? null;
  // La hora pedida existía pero ya no está libre: la tomó otro turno (CA3).
  const horarioTomado = horaPedida !== null && horario === null;

  const paso = !paciente ? 1 : !vacuna ? 2 : 3;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <Link href="/turnos-vacunacion" className="hover:text-on-surface">
              Turnos de vacunación
            </Link>
            <span className="text-outline">›</span>
            <span className="text-on-surface">Asignar turno</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Asignar turno de vacunación</h1>
          <p className="mt-1 text-on-surface-variant">
            Completá los datos para agendar una aplicación en sala de vacunación.
          </p>
        </div>
      </header>

      <Pasos
        actual={paso}
        paciente={paciente?.nombreCompleto}
        vacuna={vacuna?.nombre}
        hrefPaso1={urlAsignacion({ q })}
        hrefPaso2={paciente ? urlAsignacion({ q, paciente: paciente.id }) : undefined}
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-4">
          {paso === 1 && (
            <PasoPaciente q={q} resultados={resultados} />
          )}

          {paso === 2 && paciente && (
            <Tarjeta titulo="Elegí la vacuna" icono={<Syringe className="h-4 w-4" />}>
              <PacienteElegido
                paciente={paciente}
                hrefCambiar={urlAsignacion({ q })}
              />
              <ul className="flex flex-col gap-3">
                {vacunas.map((v) => {
                  const elegida = vacuna?.id === v.id;
                  const contenido = (
                    <>
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-on-surface">{v.nombre}</span>
                        {v.stockActual === 0 ? (
                          <span className="inline-flex items-center rounded bg-surface-container-highest px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                            {MSG_SIN_STOCK}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded bg-surface-container px-2 py-0.5 font-mono text-xs font-semibold text-on-surface">
                            {v.stockActual} disponibles
                          </span>
                        )}
                      </div>
                      {elegida && (
                        <span className="flex items-center gap-1 text-xs font-semibold text-on-surface-variant">
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                          Seleccionada
                        </span>
                      )}
                    </>
                  );
                  const clases = `flex flex-col gap-2 rounded-xl p-4 transition-colors ${
                    elegida
                      ? "bg-surface-container-low ring-2 ring-primary/30"
                      : "bg-surface-container-lowest shadow-sm hover:bg-surface-container-low"
                  }`;
                  return (
                    <li key={v.id}>
                      {v.stockActual === 0 ? (
                        <div aria-disabled="true" className={`${clases} cursor-not-allowed opacity-60`}>
                          {contenido}
                        </div>
                      ) : (
                        <Link
                          href={urlAsignacion({ q, paciente: paciente.id, vacuna: v.id })}
                          scroll={false}
                          aria-current={elegida ? "true" : undefined}
                          className={clases}
                        >
                          {contenido}
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
              <Link
                href={urlAsignacion({ q })}
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-on-surface hover:underline"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver al paso 1
              </Link>
            </Tarjeta>
          )}

          {paso === 3 && paciente && vacuna && (
            <Tarjeta titulo="Elegí el día y horario" icono={<CalendarCheck className="h-4 w-4" />}>
              <div className="flex flex-wrap gap-4">
                <PacienteElegido
                  paciente={paciente}
                  hrefCambiar={urlAsignacion({ q })}
                />
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3">
                  <div>
                    <p className="font-semibold">{vacuna.nombre}</p>
                    <p className="text-xs text-on-surface-variant">
                      {vacuna.stockActual} unidades disponibles
                    </p>
                  </div>
                  <Link
                    href={urlAsignacion({ q, paciente: paciente.id })}
                    className="text-xs font-semibold text-on-surface underline"
                  >
                    Cambiar vacuna
                  </Link>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 rounded-lg bg-surface-container-low px-4 py-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Fecha:
                </span>
                <Link
                  href={urlAsignacion({
                    q,
                    paciente: paciente.id,
                    vacuna: vacuna.id,
                    fecha: diaHabilAnterior(fechaSeleccionada),
                  })}
                  aria-label="Día hábil anterior"
                  scroll={false}
                  className="flex h-9 w-9 items-center justify-center rounded bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                </Link>
                <span className="min-w-40 text-center text-sm font-semibold text-on-surface">
                  {etiquetaDia(diaSemanaDe(fechaSeleccionada))} {formatearFecha(fechaSeleccionada)}
                </span>
                <Link
                  href={urlAsignacion({
                    q,
                    paciente: paciente.id,
                    vacuna: vacuna.id,
                    fecha: proximoDiaHabil(fechaSeleccionada),
                  })}
                  aria-label="Día hábil siguiente"
                  scroll={false}
                  className="flex h-9 w-9 items-center justify-center rounded bg-surface-container-high text-on-surface transition-colors hover:bg-surface-container-highest"
                >
                  <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                </Link>
                <form
                  method="GET"
                  action="/turnos-vacunacion/asignar"
                  className="ml-auto flex items-center gap-2"
                >
                  <input type="hidden" name="q" value={q} />
                  <input type="hidden" name="paciente" value={paciente.id} />
                  <input type="hidden" name="vacuna" value={vacuna.id} />
                  <label htmlFor="fecha-asignacion" className="sr-only">
                    Ir a la fecha
                  </label>
                  <input
                    id="fecha-asignacion"
                    name="fecha"
                    type="date"
                    min={hoy}
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

              <p className="text-sm text-on-surface-variant">
                Intervalos de <b className="text-on-surface">15 min</b> (08:00 a 18:00) · Días
                hábiles: <b className="text-on-surface">Lunes a Viernes</b>
              </p>

              <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-surface-container-low ring-1 ring-outline" />
                  Disponible
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded bg-surface-container-highest" />
                  Ocupado
                </span>
              </div>

              {horarioTomado && <Aviso>{MSG_TURNO_NO_DISPONIBLE}. Elegí otro horario.</Aviso>}

              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {grilla.map((slot) => {
                  const libre = libres.find((h) => h.inicioMin === slot.inicioMin);
                  const ocupado = ocupados.some((o) => seSuperponen(slot, o));
                  const elegido = horario?.inicioMin === slot.inicioMin;
                  if (!libre) {
                    return (
                      <li key={slot.inicioMin}>
                        <span
                          aria-disabled="true"
                          title={ocupado ? "Ocupado" : "No disponible"}
                          className={`flex h-11 items-center justify-center rounded font-mono text-sm tabular-nums ${
                            ocupado
                              ? "bg-surface-container-highest text-outline"
                              : "bg-surface-container-lowest text-outline"
                          }`}
                        >
                          {formatearHora(slot.inicioMin)}
                        </span>
                      </li>
                    );
                  }
                  return (
                    <li key={slot.inicioMin}>
                      <Link
                        href={urlAsignacion({
                          q,
                          paciente: paciente.id,
                          vacuna: vacuna.id,
                          fecha: fechaSeleccionada,
                          hora: slot.inicioMin,
                        })}
                        scroll={false}
                        aria-current={elegido ? "true" : undefined}
                        className={`flex h-11 items-center justify-between rounded px-3 font-mono text-sm tabular-nums transition-colors ${
                          elegido
                            ? "bg-primary text-on-primary"
                            : "bg-surface-container-low text-on-surface hover:bg-surface-container-high"
                        }`}
                      >
                        {formatearHora(slot.inicioMin)}
                        {elegido && <Check className="h-4 w-4" aria-hidden="true" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>

              <p className="flex items-start gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-xs text-on-surface-variant">
                <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                Dosis sujeta a stock en confirmación. Al confirmar se descuenta 1 unidad del stock
                de la vacuna.
              </p>

              <Link
                href={urlAsignacion({ q, paciente: paciente.id })}
                className="inline-flex items-center gap-2 self-start text-sm font-semibold text-on-surface hover:underline"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Volver al paso 2
              </Link>
            </Tarjeta>
          )}
        </div>

        <aside className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm lg:sticky lg:top-16">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-base font-semibold">Resumen del turno</h2>
            <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-[11px] font-semibold">
              {paso} de 3
            </span>
          </div>
          <dl className="flex flex-col gap-3 text-sm">
            <FilaResumen
              etiqueta="Paciente"
              valor={paciente?.nombreCompleto ?? "—"}
              detalle={paciente?.dni ? `DNI ${paciente.dni}` : undefined}
            />
            <FilaResumen
              etiqueta="Vacuna"
              valor={vacuna?.nombre ?? "—"}
              detalle={vacuna ? `${vacuna.stockActual} unidades disponibles` : undefined}
            />
            <FilaResumen
              etiqueta="Fecha"
              valor={
                paso === 3
                  ? `${etiquetaDia(diaSemanaDe(fechaSeleccionada))} ${formatearFecha(fechaSeleccionada)}`
                  : "—"
              }
            />
            <FilaResumen
              etiqueta="Hora"
              valor={horario ? `${formatearHora(horario.inicioMin)} hs` : "—"}
            />
          </dl>
          {paciente && vacuna && horario ? (
            <ConfirmarAsignacionForm
              pacienteId={paciente.id}
              vacunaId={vacuna.id}
              fecha={fechaSeleccionada}
              inicioMin={horario.inicioMin}
            />
          ) : (
            <p className="text-xs text-on-surface-variant">
              Completá los pasos para ver el botón &quot;Confirmar&quot;.
            </p>
          )}
          <Link
            href="/turnos-vacunacion"
            className="text-center text-xs font-semibold text-on-surface-variant hover:text-on-surface"
          >
            Cancelar
          </Link>
        </aside>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paso 1 — búsqueda y selección del paciente
// ---------------------------------------------------------------------------

function PasoPaciente({ q, resultados }: { q: string; resultados: PacienteActivo[] }) {
  return (
    <Tarjeta titulo="Buscá al paciente" icono={<UserRound className="h-4 w-4" />}>
      <form method="GET" action="/turnos-vacunacion/asignar" className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label
            htmlFor="paciente-busqueda"
            className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
          >
            Paciente (solo pacientes activos)
          </label>
          <input
            id="paciente-busqueda"
            name="q"
            type="text"
            defaultValue={q}
            placeholder="Buscar por nombre o DNI"
            className="h-10 w-full rounded bg-surface px-3 text-sm text-on-surface placeholder:text-outline focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
        >
          Buscar
        </button>
      </form>

      {q && (
        <>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Resultados ({resultados.length})
          </h2>
          {resultados.length === 0 ? (
            <p className="rounded-xl bg-surface-container-lowest p-6 text-center text-sm text-on-surface-variant shadow-sm">
              {MSG_PACIENTE_NO_ENCONTRADO}
            </p>
          ) : (
            <ul className="flex flex-col gap-3">
              {resultados.map((r) => (
                <li key={r.id}>
                  <Link
                    href={urlAsignacion({ q, paciente: r.id })}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-container-lowest p-5 shadow-sm transition-colors hover:bg-surface-container-low"
                  >
                    <div>
                      <p className="font-semibold">{r.nombreCompleto}</p>
                      <p className="text-sm text-on-surface-variant">
                        {r.dni ? `DNI ${r.dni}` : "Sin DNI registrado"}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-on-surface">
                      Elegir
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Tarjeta>
  );
}

// ---------------------------------------------------------------------------
// Piezas comunes
// ---------------------------------------------------------------------------

function PacienteElegido({ paciente, hrefCambiar }: { paciente: PacienteActivo; hrefCambiar: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container-low px-4 py-3">
      <div>
        <p className="font-semibold">{paciente.nombreCompleto}</p>
        <p className="text-xs text-on-surface-variant">
          {paciente.dni ? `DNI ${paciente.dni} · ` : ""}ACTIVO
        </p>
      </div>
      <Link href={hrefCambiar} className="text-xs font-semibold text-on-surface underline">
        Cambiar
      </Link>
    </div>
  );
}

function Pasos({
  actual,
  paciente,
  vacuna,
  hrefPaso1,
  hrefPaso2,
}: {
  actual: number;
  paciente?: string;
  vacuna?: string;
  hrefPaso1: string;
  hrefPaso2?: string;
}) {
  const pasos = [
    { n: 1, titulo: "Elegir paciente", detalle: paciente, href: hrefPaso1 },
    { n: 2, titulo: "Elegir vacuna", detalle: vacuna, href: hrefPaso2 },
    { n: 3, titulo: "Elegir horario", detalle: undefined, href: undefined },
  ];
  return (
    <ol className="grid grid-cols-1 gap-2 rounded-xl bg-surface-container-lowest p-3 shadow-sm sm:grid-cols-3">
      {pasos.map((p) => {
        const completo = p.n < actual;
        const enCurso = p.n === actual;
        const contenido = (
          <>
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded text-sm font-bold ${
                enCurso || completo ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {completo ? <Check className="h-4 w-4" aria-hidden="true" /> : p.n}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">
                Paso {p.n} · {completo ? "Completado" : enCurso ? "En curso" : "Pendiente"}
              </span>
              <span
                className={`truncate text-sm font-semibold ${enCurso || completo ? "text-on-surface" : "text-on-surface-variant"}`}
              >
                {p.detalle ?? p.titulo}
              </span>
            </span>
          </>
        );
        return (
          <li
            key={p.n}
            aria-current={enCurso ? "step" : undefined}
            className={`rounded-lg ${enCurso ? "bg-surface-container-low" : ""}`}
          >
            {completo && p.href ? (
              <Link href={p.href} className="flex items-center gap-3 p-2 hover:opacity-80">
                {contenido}
              </Link>
            ) : (
              <div className="flex items-center gap-3 p-2">{contenido}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Tarjeta({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-on-primary" aria-hidden="true">
          {icono}
        </span>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Aviso({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="flex items-start gap-2 rounded-lg bg-surface-container-high px-4 py-3 text-sm font-semibold">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}

function FilaResumen({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">{etiqueta}</dt>
      <dd className="font-semibold">{valor}</dd>
      {detalle && <dd className="text-xs text-on-surface-variant">{detalle}</dd>}
    </div>
  );
}

function AsignacionExitosa({
  paciente,
  dni,
  vacuna,
  fecha,
  inicioMin,
}: {
  paciente: string;
  dni: string | null;
  vacuna: string;
  fecha: FechaISO;
  inicioMin: number;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-5 rounded-xl bg-surface-container-lowest p-8 text-center shadow-sm">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-on-primary">
        <Check className="h-7 w-7" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Turno asignado</h1>
        <p role="status" className="mt-1 text-on-surface-variant">
          El turno quedó reservado y la dosis se descontó del stock.
        </p>
      </div>
      <dl className="grid w-full grid-cols-2 gap-3 rounded-lg bg-surface-container-low p-4 text-left text-sm">
        <FilaResumen etiqueta="Paciente" valor={paciente} detalle={dni ? `DNI ${dni}` : undefined} />
        <FilaResumen etiqueta="Vacuna" valor={vacuna} />
        <FilaResumen
          etiqueta="Fecha"
          valor={`${etiquetaDia(diaSemanaDe(fecha))} ${formatearFecha(fecha)}`}
        />
        <FilaResumen etiqueta="Hora" valor={`${formatearHora(inicioMin)} hs`} />
      </dl>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/turnos-vacunacion"
          className="inline-flex h-10 items-center rounded bg-primary px-5 text-sm font-semibold text-on-primary hover:bg-secondary"
        >
          Ver turnos del día
        </Link>
        <Link
          href="/turnos-vacunacion/asignar"
          className="inline-flex h-10 items-center rounded bg-surface-container-low px-5 text-sm font-semibold text-on-surface hover:bg-surface-container"
        >
          Asignar otro turno
        </Link>
      </div>
    </div>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  esMesHabilitado,
  etiquetaMes,
  formatearHora,
  formatearMes,
  hoyEnArgentina,
  mesDeFecha,
  mesesHabilitados,
  parsearMes,
  patronDesdeFranjas,
  primerDiaDelMes,
  rangoDelMes,
  sumarMeses,
  type FranjaSemanal,
} from "@/lib/domain/agenda";
import { listarFranjas, obtenerDuracionTurno } from "@/lib/agenda-repository";
import { requireMedico } from "@/lib/authorization";
import { DuracionForm } from "./duracion-form";
import { FranjasEditor, type FilaFranja } from "./franjas-editor";

export const dynamic = "force-dynamic";

const MENSAJES_GUARDADO: Record<string, string> = {
  franjas: "Tu disponibilidad se guardó correctamente.",
  cerrada: "Cerraste tu agenda para lo que queda del mes.",
};

/** `"2026-10-19"` → `"19/10"`. */
function fechaCorta(fecha: string): string {
  return `${fecha.slice(8, 10)}/${fecha.slice(5, 7)}`;
}

function aFilas(patron: FranjaSemanal[]): FilaFranja[] {
  return patron.map((f) => ({
    diaSemana: f.diaSemana,
    inicio: formatearHora(f.inicioMin),
    fin: formatearHora(f.finMin),
  }));
}

/**
 * US-25, US-26 y US-28 (RF-01) — Configuración de la agenda del médico:
 * duración de turnos y franjas de atención del mes (`?mes=YYYY-MM`).
 */
export default async function DisponibilidadPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; guardado?: string }>;
}) {
  const medico = await requireMedico();
  const { mes: mesParam, guardado } = await searchParams;

  const hoy = hoyEnArgentina(new Date());
  const mesPedido = mesParam ? parsearMes(mesParam) : null;
  const mes =
    mesPedido && esMesHabilitado(mesPedido, hoy) ? mesPedido : mesDeFecha(hoy);

  const [duracionActual, franjasDelMes] = await Promise.all([
    obtenerDuracionTurno(medico.id),
    listarFranjas(medico.id, rangoDelMes(mes)),
  ]);

  // El patrón vigente sale de las franjas de hoy en adelante: si el médico
  // cerró la agenda del resto del mes, las franjas pasadas no lo reabren.
  const filasIniciales = aFilas(
    patronDesdeFranjas(franjasDelMes.filter((f) => f.fecha >= hoy)),
  );

  // Mes sin ninguna franja: se ofrece copiar el patrón del mes anterior.
  let sugerencia: { etiquetaMes: string; filas: FilaFranja[] } | null = null;
  if (franjasDelMes.length === 0) {
    const mesAnterior = sumarMeses(mes, -1);
    const franjasAnteriores = await listarFranjas(medico.id, rangoDelMes(mesAnterior));
    if (franjasAnteriores.length > 0) {
      sugerencia = {
        etiquetaMes: etiquetaMes(mesAnterior),
        filas: aFilas(patronDesdeFranjas(franjasAnteriores)),
      };
    }
  }
  const mensajeGuardado = guardado ? MENSAJES_GUARDADO[guardado] : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            <span>Módulo de agenda</span>
            <span className="text-outline">/</span>
            <span className="text-on-surface">Configuración de cupos</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Cargar disponibilidad</h1>
          <p className="mt-1 text-on-surface-variant">
            Establecé la duración de tus consultas y diagramá los bloques
            horarios del consultorio.
          </p>
        </div>
        <Link
          href={`/medico/agenda?mes=${formatearMes(mes)}`}
          className="inline-flex h-10 items-center gap-2 rounded bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a Mi agenda
        </Link>
      </div>

      {mensajeGuardado && (
        <div
          role="status"
          className="rounded-lg bg-primary-fixed px-4 py-3 text-sm font-medium text-on-primary-fixed"
        >
          {mensajeGuardado}
        </div>
      )}

      <DuracionForm duracionActual={duracionActual} />

      <FranjasEditor
        // Se vuelve a montar al cambiar de mes o al guardar franjas, para partir
        // de lo guardado. NO depende de la duración: cambiarla no debe borrar
        // las filas sin guardar (defecto 10).
        key={`${formatearMes(mes)}|${JSON.stringify(filasIniciales)}`}
        mes={formatearMes(mes)}
        etiquetaMesActual={etiquetaMes(mes)}
        aplicaDesde={hoy > primerDiaDelMes(mes) ? fechaCorta(hoy) : null}
        meses={mesesHabilitados(hoy).map((m) => ({
          valor: formatearMes(m),
          etiqueta: etiquetaMes(m),
        }))}
        duracionTurnoMin={duracionActual}
        filasIniciales={filasIniciales}
        sugerencia={sugerencia}
      />
    </div>
  );
}

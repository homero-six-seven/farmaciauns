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
  sumarMeses,
  ultimoDiaDelMes,
  type FranjaSemanal,
  type MesAgenda,
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

function rangoDelMes(mes: MesAgenda) {
  return { desde: primerDiaDelMes(mes), hasta: ultimoDiaDelMes(mes) };
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
  const mensajeGuardado =
    guardado === "duracion"
      ? `La duración de tus turnos se guardó: ${duracionActual} min.`
      : guardado
        ? MENSAJES_GUARDADO[guardado]
        : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
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

      {mensajeGuardado && (
        <div
          role="status"
          className="rounded-lg bg-primary-fixed px-4 py-3 text-sm font-medium text-on-primary-fixed"
        >
          {mensajeGuardado}
        </div>
      )}

      <DuracionForm
        key={duracionActual ?? "sin-duracion"}
        duracionActual={duracionActual}
        mes={formatearMes(mes)}
      />

      <FranjasEditor
        // Se vuelve a montar al cambiar de mes o al guardar, para partir de lo guardado.
        key={`${formatearMes(mes)}|${duracionActual}|${JSON.stringify(filasIniciales)}`}
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

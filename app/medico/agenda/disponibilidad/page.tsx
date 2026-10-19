import {
  esMesHabilitado,
  formatearMes,
  hoyEnArgentina,
  mesDeFecha,
  parsearMes,
} from "@/lib/domain/agenda";
import { obtenerDuracionTurno } from "@/lib/agenda-repository";
import { requireMedico } from "@/lib/authorization";
import { DuracionForm } from "./duracion-form";

export const dynamic = "force-dynamic";

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

  const duracionActual = await obtenerDuracionTurno(medico.id);

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

      {guardado === "duracion" && (
        <div
          role="status"
          className="rounded-lg bg-primary-fixed px-4 py-3 text-sm font-medium text-on-primary-fixed"
        >
          La duración de tus turnos se guardó: {duracionActual} min.
        </div>
      )}

      <DuracionForm
        key={duracionActual ?? "sin-duracion"}
        duracionActual={duracionActual}
        mes={formatearMes(mes)}
      />
    </div>
  );
}

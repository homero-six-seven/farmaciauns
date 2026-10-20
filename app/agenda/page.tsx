import Link from "next/link";
import { requireRole } from "@/lib/authorization";

export const dynamic = "force-dynamic";

/**
 * US-27 — "Mi agenda" (solo MEDICO). Placeholder: la agenda aún no está
 * conectada. Muestra "FALTA CONECTAR" hasta implementar la grilla de turnos.
 */
export default async function AgendaPage() {
  await requireRole(["medico"]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col">
      <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        <Link
          href="/inicio"
          className="text-on-surface-variant transition-colors hover:text-on-surface"
        >
          Inicio
        </Link>
        <span className="text-outline">/</span>
        <span className="text-on-surface">Mi agenda</span>
      </div>

      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Mi agenda</h1>
        <p className="mt-1 text-on-surface-variant">
          Gestión de turnos y disponibilidad.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-16 text-center shadow-sm">
        <span className="material-symbols-outlined text-5xl text-on-surface-variant">
          calendar_month
        </span>
        <h2 className="mt-4 text-xl font-bold uppercase tracking-wide text-on-surface">
          Falta conectar
        </h2>
        <p className="mt-2 max-w-md text-sm text-on-surface-variant">
          La agenda todavía no está disponible. Estamos trabajando para
          habilitar esta sección.
        </p>
      </div>
    </div>
  );
}

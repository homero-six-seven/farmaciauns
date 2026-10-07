import Link from "next/link";
import { ListadoUsuarios } from "@/components/listado-usuarios";
import { toUsuarioPublico } from "@/lib/domain/usuario";
import { getUserRepository } from "@/lib/repository";
import { requireRole } from "@/lib/authorization";

export const dynamic = "force-dynamic";

/**
 * US-13 (RF-25) — Listado de personal administrativo (exclusivo ADMINISTRADOR).
 * Ordenado alfabéticamente por apellido (lo garantiza `listByRole`).
 */
export default async function ListadoPersonalAdministrativoPage() {
  await requireRole(["admin"]);

  const personal = getUserRepository()
    .listByRole("ADMINISTRATIVO")
    .map(toUsuarioPublico);

  return (
    <div className="mx-auto flex max-w-6xl flex-col">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <span>Módulo administrativo</span>
          <span className="text-outline">/</span>
          <span className="text-on-surface">Listado de personal administrativo</span>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Listado de personal administrativo
            </h1>
            <p className="mt-1 text-on-surface-variant">
              Nómina institucional del personal de admisiones, recepción y
              secretaría.
            </p>
          </div>
          <Link
            href="/admin/personal/nuevo"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
          >
            + Nuevo administrativo
          </Link>
        </div>

        {personal.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-low p-12 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded bg-surface-container-high text-on-surface-variant">
              <svg
                className="h-7 w-7"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="9" cy="8" r="4" />
                <path d="M3 21v-2a6 6 0 0 1 12 0v2" />
                <path d="M16 4h6M19 1v6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-on-surface">
              No hay personal administrativo registrado
            </h2>
            <p className="mt-2 max-w-md text-sm text-on-surface-variant">
              Utilizá el botón “Nuevo administrativo” para registrar al primer
              integrante del equipo.
            </p>
            <Link
              href="/admin/personal/nuevo"
              className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container-lowest px-5 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
            >
              + Registrar personal administrativo
            </Link>
          </div>
        ) : (
          <ListadoUsuarios usuarios={personal} />
        )}
    </div>
  );
}

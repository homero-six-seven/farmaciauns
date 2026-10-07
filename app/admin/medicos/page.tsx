import Link from "next/link";
import { ListadoUsuarios } from "@/components/listado-usuarios";
import {
  ESPECIALIDADES,
  toUsuarioPublico,
} from "@/lib/domain/usuario";
import { getUserRepository } from "@/lib/repository";
import { requireRole } from "@/lib/authorization";

export const dynamic = "force-dynamic";

/**
 * US-10 (RF-23) — Listado de médicos (exclusivo ADMINISTRADOR).
 * Ordenado por apellido (lo garantiza `listByRole`) y filtrable por
 * especialidad y estado mediante un `<form method="GET">` (progressive
 * enhancement, sin JS), igual que el filtro de `/pacientes`.
 */
export default async function ListadoMedicosPage({
  searchParams,
}: {
  searchParams: Promise<{ especialidad?: string; estado?: string }>;
}) {
  await requireRole(["admin"]);

  const { especialidad, estado } = await searchParams;

  const medicos = (await getUserRepository().listByRole("MEDICO"))
    .filter((m) => !especialidad || m.especialidad === especialidad)
    .filter((m) =>
      estado === "activo" ? m.active : estado === "inactivo" ? !m.active : true,
    )
    .map(toUsuarioPublico);

  const hayFiltro = Boolean(especialidad || estado);

  return (
    <div className="mx-auto flex max-w-6xl flex-col">
        <div className="mb-6 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
          <span>Módulo administrativo</span>
          <span className="text-outline">/</span>
          <span className="text-on-surface">Listado de médicos</span>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-surface-container-lowest p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Listado de médicos
            </h1>
            <p className="mt-1 text-on-surface-variant">
              Nómina institucional del cuerpo médico, filtrable por
              especialidad y estado.
            </p>
          </div>
          <Link
            href="/admin/medicos/nuevo"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded bg-primary px-4 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
          >
            + Nuevo médico
          </Link>
        </div>

        {/* Filtro de listado (GET form, sin JS) */}
        <form
          method="GET"
          action="/admin/medicos"
          className="mb-6 flex flex-col gap-3 rounded-xl bg-surface-container-lowest p-4 shadow-sm lg:flex-row lg:items-end"
        >
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              htmlFor="medico-especialidad"
              className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Especialidad
            </label>
            <select
              id="medico-especialidad"
              name="especialidad"
              defaultValue={especialidad ?? ""}
              className="h-10 w-full rounded bg-surface px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todas</option>
              {ESPECIALIDADES.map((esp) => (
                <option key={esp} value={esp}>
                  {esp}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label
              htmlFor="medico-estado"
              className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
            >
              Estado
            </label>
            <select
              id="medico-estado"
              name="estado"
              defaultValue={estado ?? ""}
              className="h-10 w-full rounded bg-surface px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
            >
              Filtrar
            </button>
            <Link
              href="/admin/medicos"
              className="inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container-low px-4 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Limpiar
            </Link>
          </div>
        </form>

        {medicos.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-surface-container-lowest p-12 text-center shadow-sm">
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
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-on-surface">
              {hayFiltro
                ? "No hay médicos que coincidan con el filtro"
                : "No hay médicos registrados"}
            </h2>
            <p className="mt-2 max-w-md text-sm text-on-surface-variant">
              {hayFiltro
                ? "Probá con otra combinación de especialidad y estado, o limpiá el filtro para ver todos los médicos."
                : "Utilizá el botón “Nuevo médico” para registrar al primer integrante del cuerpo médico."}
            </p>
            <div className="mt-6">
              {hayFiltro ? (
                <Link
                  href="/admin/medicos"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
                >
                  Limpiar filtro
                </Link>
              ) : (
                <Link
                  href="/admin/medicos/nuevo"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container-lowest px-5 text-sm font-semibold text-on-surface shadow-sm transition-colors hover:bg-surface-container-high"
                >
                  + Registrar médico
                </Link>
              )}
            </div>
          </div>
        ) : (
          <ListadoUsuarios
            usuarios={medicos}
            mostrarEspecialidad
            puedeEliminar
          />
        )}
    </div>
  );
}

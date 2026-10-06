import Link from "next/link";

/**
 * Pantalla de "acceso denegado" (consistente con `pantalla_6_acceso_denegado`).
 * Componente de servidor/presentacional: se usa en las páginas que bloquean
 * por rol (US-12 y US-13).
 */
export function AccesoDenegado() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-on-surface">
      <div className="flex w-full max-w-md flex-col items-center rounded-xl bg-surface-container-lowest p-10 text-center shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-container-high">
          <svg
            className="h-8 w-8 text-outline"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 9l6 6M15 9l-6 6" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Acceso denegado</h1>
        <p className="mt-2 text-on-surface-variant">
          No tenés permiso para acceder a esta sección
        </p>
        <div className="mt-8 flex w-full flex-col items-center gap-2">
          <Link
            href="/"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
          >
            Volver al inicio
          </Link>
        </div>
        <p className="mt-6 flex items-center gap-2 text-xs text-on-surface-variant">
          <span aria-hidden="true">ℹ</span>
          Si considerás que esto es un error, comunicate con recepción.
        </p>
      </div>
    </main>
  );
}

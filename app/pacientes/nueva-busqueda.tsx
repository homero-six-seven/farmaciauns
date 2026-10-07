"use client";

/**
 * Botón "Nueva búsqueda" (estado vacío de US-12): limpia y enfoca el input
 * de búsqueda para iniciar una nueva consulta sin recargar la página.
 */
export function NuevaBusqueda() {
  return (
    <button
      type="button"
      onClick={() => {
        const input = document.getElementById(
          "paciente-search",
        ) as HTMLInputElement | null;
        if (input) {
          input.value = "";
          input.focus();
        }
      }}
      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
    >
      Nueva búsqueda
    </button>
  );
}

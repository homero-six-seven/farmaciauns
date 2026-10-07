import type { ReactNode } from "react";

type InfoCardProps = {
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
};

/**
 * Tarjeta de información (panel de ayuda). Se usa en el `aside` derecho del
 * "Layout Base de Formulario" (`FormBaseLayout`).
 *
 * Se puede pasar `descripcion` (texto plano) o `children` (contenido libre);
 * si vienen ambos, gana `children`.
 */
export function InfoCard({ titulo, descripcion, children }: InfoCardProps) {
  return (
    <div className="rounded-lg bg-surface-container-lowest p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-on-surface">{titulo}</h3>
      {children ? (
        <div className="mt-1 text-xs text-on-surface-variant">{children}</div>
      ) : descripcion ? (
        <p className="mt-1 text-xs text-on-surface-variant">{descripcion}</p>
      ) : null}
    </div>
  );
}

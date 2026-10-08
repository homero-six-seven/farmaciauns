import type { ReactNode } from "react";

type FormBaseLayoutProps = {
  children: ReactNode;
  /** Panel derecho de ayuda (opcional). Si se omite, el form queda a ancho completo. */
  ayuda?: ReactNode;
};

/**
 * "Layout Base de Formulario" reutilizable.
 *
 * Tarjeta principal blanca. Si se pasa `ayuda`, se divide en grilla
 * (`lg:grid-cols-3`): formulario a la izquierda (`col-span-2`) y panel
 * vertical de ayuda a la derecha (`col-span-1`). Si NO se pasa `ayuda`,
 * el formulario ocupa todo el ancho.
 */
export function FormBaseLayout({ children, ayuda }: FormBaseLayoutProps) {
  return (
    <div className="rounded-xl bg-surface-container-lowest p-6 shadow-sm">
      {ayuda ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">{children}</div>
          <aside className="flex flex-col gap-4 lg:col-span-1">{ayuda}</aside>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

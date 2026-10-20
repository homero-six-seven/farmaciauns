import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * Envuelve `/pacientes` con el mismo shell (encabezado + panel lateral) que el
 * resto de los sectores, para que la navegación no cambie de forma al entrar.
 */
export default function PacientesLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

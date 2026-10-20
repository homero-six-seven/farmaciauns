import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * Envuelve las rutas del médico (`/medico/*`, RF-01) con el mismo
 * `AppShell` (sidebar + header) que el resto del sistema. El control de
 * acceso lo hace cada página y cada server action con `requireMedico`.
 */
export default function MedicoLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

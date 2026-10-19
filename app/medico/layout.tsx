import type { ReactNode } from "react";
import { AdminLayout } from "@/components/admin-layout";

/**
 * Envuelve las rutas del médico (`/medico/*`, RF-01) con el mismo
 * `AdminLayout` (sidebar + header) que el resto del sistema. El control de
 * acceso lo hace cada página y cada server action con `requireMedico`.
 */
export default function MedicoLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

import type { ReactNode } from "react";
import { AdminLayout } from "@/components/admin-layout";

/**
 * Envuelve `/pacientes` con el mismo `AdminLayout` (sidebar + header) que las
 * rutas `/admin/*`, para que la barra lateral de navegación no desaparezca.
 */
export default function PacientesLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

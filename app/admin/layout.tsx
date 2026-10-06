import type { ReactNode } from "react";
import { AdminLayout } from "@/components/admin-layout";

/**
 * Layout raíz del módulo administrativo: envuelve TODAS las rutas `/admin/*`
 * con `AdminLayout` (sidebar + header + `<main>` con padding y fondo).
 *
 * Las páginas hijas NO deben declarar su propio `<main className="min-h-screen
 * bg-surface ...">`: el `<main>` y el fondo ya los provee `AdminLayout`.
 */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}

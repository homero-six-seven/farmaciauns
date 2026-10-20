import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * `/agenda` usa el mismo shell que el resto de los sectores, así el logo y el
 * panel lateral se mantienen consistentes al navegar.
 */
export default function AgendaLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * `/dosis` usa el mismo shell que el resto de los sectores, así el logo y el
 * panel lateral se mantienen consistentes al navegar.
 */
export default function DosisLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * `/cobertura` usa el mismo shell que el resto de los sectores, así el logo y
 * el panel lateral se mantienen consistentes al navegar.
 */
export default function CoberturaLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

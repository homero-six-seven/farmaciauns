import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";

/**
 * `/stock` usa el mismo shell que el resto de los sectores, así el logo y el
 * panel lateral se mantienen consistentes al navegar.
 */
export default function StockLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import type { ReactNode } from "react";
import { SidebarNav } from "./sidebar-nav";

/**
 * Layout del módulo administrativo (server component).
 *
 *  - Sidebar izquierdo: navegación vertical del módulo, con el MISMO estilo
 *    visual que la página de inicio (`/inicio`): fondo blanco, ítem activo en
 *    píldora navy y hover suave.
 *  - Columna derecha: barra superior con la cuenta del usuario (nombre +
 *    `UserButton` de Clerk, que despliega un panel para cerrar sesión) —
 *    mismo formato que `/inicio`.
 */
export async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await currentUser();
  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;

  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 shrink-0 flex-col gap-6 bg-surface-container-lowest p-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <h2 className="px-2 text-xs font-semibold uppercase tracking-wider text-secondary">
          Módulo administrativo
        </h2>
        <SidebarNav />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest px-6">
          <span className="text-sm font-semibold uppercase tracking-wide text-on-surface">
            Sala Médica
          </span>
          <div className="flex items-center gap-3">
            {displayName && (
              <span className="text-sm text-on-surface">{displayName}</span>
            )}
            <UserButton />
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

import { UserButton } from "@clerk/nextjs";
import { SignOutButton } from "@clerk/nextjs";
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
    <div className="min-h-screen bg-surface text-on-surface">
      <header className="fixed inset-x-0 top-0 z-40 flex h-12 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded bg-black text-white">
            <span className="material-symbols-outlined text-[17px]">local_hospital</span>
          </span>
          <span className="text-xs font-bold uppercase tracking-tight">Sala Médica</span>
        </div>
        <div className="flex items-center gap-3">
          {displayName && (
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold text-on-surface">{displayName}</p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-on-surface-variant">
                Administrador
              </span>
            </div>
          )}
          <UserButton />
          <span className="h-6 w-px bg-outline-variant" aria-hidden="true" />
          <SignOutButton redirectUrl="/sign-in">
            <button
              type="button"
              className="hidden rounded border border-outline-variant px-3 py-1 text-[11px] font-semibold text-on-surface transition-colors hover:bg-surface-container sm:block"
            >
              Cerrar sesión
            </button>
          </SignOutButton>
        </div>
      </header>

      <div className="flex min-h-screen pt-12">
        <aside className="flex max-h-[calc(100vh-3rem)] w-52 shrink-0 flex-col justify-between overflow-y-auto border-r border-surface-container-high bg-surface-container-lowest px-2 py-3">
          <div>
            <h2 className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-secondary">
              Gestión Clínica
            </h2>
            <SidebarNav />
          </div>
          <p className="border-t border-surface-container-high px-2 pt-3 text-[10px] text-secondary">
            Sistema Sala Médica v1.0
          </p>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

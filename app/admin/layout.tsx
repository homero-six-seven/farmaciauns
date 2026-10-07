import { UserButton, SignOutButton } from "@clerk/nextjs";
import { getCurrentAdmin } from "../../lib/auth";
import { AdminNav } from "./admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { displayName } = await getCurrentAdmin();

  return (
    <div className="bg-surface text-on-surface font-body-md text-body-md min-h-screen">
      {/* Sidebar fijo (256px / w-64) */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-50 flex flex-col justify-between">
        <div className="flex flex-col">
          {/* Logo / Brand */}
          <div className="h-16 px-space-lg flex items-center gap-space-sm bg-surface-container-lowest border-b border-surface-container-low">
            <span className="material-symbols-outlined text-primary text-[24px]">
              local_hospital
            </span>
            <div className="flex items-center gap-space-xs">
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-bold">
                Sala Médica
              </span>
              <span className="px-space-xs py-0.5 rounded bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase">
                v1.0
              </span>
            </div>
          </div>

          <div className="px-space-md pt-space-lg pb-space-xs">
            <span className="font-label-sm text-label-sm uppercase text-secondary tracking-wider px-space-sm font-semibold">
              Gestión Clínica
            </span>
          </div>

          <AdminNav />
        </div>

        <div className="p-space-md bg-surface-container-low border-t border-surface-container">
          <div className="text-center font-label-sm text-label-sm text-secondary">
            Sistema Sala Médica v1.0
          </div>
        </div>
      </aside>

      {/* Main Content Area con Header superior */}
      <div className="pl-64">
        {/* Header superior */}
        <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/90 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-40 flex items-center justify-between px-space-xl">
          <div className="flex items-center gap-space-sm">
            <span className="px-space-sm py-0.5 rounded bg-surface-container font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
              Panel Central
            </span>
          </div>

          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm">
              <span className="font-label-md text-label-md text-on-surface font-medium">
                {displayName}
              </span>
              <span className="px-space-xs py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider font-bold">
                ADMINISTRADOR
              </span>
            </div>

            <UserButton />

            <SignOutButton redirectUrl="/sign-in">
              <button
                type="button"
                className="flex items-center gap-space-xs px-space-sm py-1.5 rounded bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface font-label-sm text-label-sm transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                <span>Cerrar sesión</span>
              </button>
            </SignOutButton>
          </div>
        </header>

        {/* Canvas de contenido */}
        <main className="relative pt-16 bg-surface min-h-[calc(100vh-4rem)] flex flex-col justify-between">
          <div className="w-full max-w-[1440px] mx-auto p-margin flex-1">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

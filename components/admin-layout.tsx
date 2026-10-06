import Link from "next/link";
import {
  BriefcaseMedical,
  IdCard,
  Stethoscope,
  UserPlus,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SignOutButton } from "./sign-out-button";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: NavItem[] = [
  { href: "/admin/medicos", label: "Listado de médicos", icon: Stethoscope },
  { href: "/admin/medicos/nuevo", label: "Alta de médico", icon: UserPlus },
  { href: "/admin/personal", label: "Listado de personal adm.", icon: IdCard },
  { href: "/admin/personal/nuevo", label: "Alta de personal adm.", icon: UserPlus },
  { href: "/admin/enfermeras", label: "Listado de enfermeras", icon: BriefcaseMedical },
  { href: "/admin/enfermeras/nuevo", label: "Alta de enfermeras", icon: UserPlus },
  { href: "/pacientes", label: "Búsqueda de pacientes", icon: UserSearch },
];

const LINK_CLASS =
  "flex items-center gap-3 rounded px-3 py-2 text-sm text-on-surface transition-colors hover:bg-surface-container-high";

/**
 * Layout del módulo administrativo (server component; solo renderiza `children`
 * + navegación con `Link`).
 *
 *  - Sidebar izquierdo: navegación vertical del módulo.
 *  - Columna derecha: barra superior (nombre + "Cerrar sesión" sin lógica real)
 *    y `<main>` scrolleable con el contenido.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="flex w-64 shrink-0 flex-col gap-6 border-r border-surface-container-high bg-surface-container-low p-4">
        <h2 className="px-2 text-sm font-semibold uppercase tracking-wider text-on-surface">
          Módulo administrativo
        </h2>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={LINK_CLASS}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-surface-container-high bg-surface-container-lowest px-6">
          <span className="text-sm font-medium text-on-surface">
            Administrador
          </span>
          <SignOutButton />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

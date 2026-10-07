"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseMedical,
  IdCard,
  LayoutDashboard,
  Stethoscope,
  UserPlus,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Navegación del módulo administrativo. Los iconos (componentes de
 * lucide-react) viven ACA, del lado del cliente: NO se pueden pasar como prop
 * desde un Server Component (Next.js lanza "Functions cannot be passed
 * directly to Client Components"). Por eso esta lista es local al componente.
 */
const NAV_ITEMS: NavItem[] = [
  { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
  { href: "/admin/medicos", label: "Listado de médicos", icon: Stethoscope },
  { href: "/admin/medicos/nuevo", label: "Alta de médico", icon: UserPlus },
  { href: "/admin/personal", label: "Listado de personal adm.", icon: IdCard },
  { href: "/admin/personal/nuevo", label: "Alta de personal adm.", icon: UserPlus },
  { href: "/admin/enfermeras", label: "Listado de enfermeras", icon: BriefcaseMedical },
  { href: "/admin/enfermeras/nuevo", label: "Alta de enfermeras", icon: UserPlus },
  { href: "/pacientes", label: "Búsqueda de pacientes", icon: UserSearch },
];

/**
 * Sidebar del módulo, con el MISMO estilo visual que la página de inicio
 * (`/inicio`): ítem activo en píldora navy `#141b2b`, links inactivos en
 * `on-surface` con hover suave. Marca el ítem activo según la ruta actual.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const isAdminModule = pathname.startsWith("/admin");
  const homeHref = isAdminModule ? "/admin" : "/inicio";
  const activeItem = NAV_ITEMS.filter(
    (item) =>
      pathname === (item.href === "/inicio" ? homeHref : item.href) ||
      (item.href !== "/inicio" &&
        item.href !== "/admin/medicos" &&
        pathname.startsWith(`${item.href}/`)),
  ).sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem?.href === item.href;
        return (
          <Link
            key={item.href}
            href={item.href === "/inicio" ? homeHref : item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              isActive
                ? "bg-[#141b2b] text-white"
                : "text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

import Link from "next/link";
import {
  BriefcaseMedical,
  IdCard,
  LayoutDashboard,
  Stethoscope,
  UserPlus,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SidebarItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Inicio", href: "/inicio", icon: LayoutDashboard },
  { label: "Listado de médicos", href: "/admin/medicos", icon: Stethoscope },
  { label: "Alta de médico", href: "/admin/medicos/nuevo", icon: UserPlus },
  { label: "Listado de personal adm.", href: "/admin/personal", icon: IdCard },
  { label: "Alta de personal adm.", href: "/admin/personal/nuevo", icon: UserPlus },
  { label: "Búsqueda de pacientes", href: "/pacientes", icon: UserSearch },
  { label: "Listado de enfermeras", href: "/admin/enfermeras", icon: BriefcaseMedical },
];

/** Ruta marcada como activa (ítem 7: "Listado de enfermeras"). */
const ACTIVE_HREF = "/admin/enfermeras";

export function Sidebar() {
  return (
    <nav className="flex flex-col gap-1" aria-label="Navegación principal">
      {SIDEBAR_ITEMS.map((item) => {
        const isActive = item.href === ACTIVE_HREF;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              isActive
                ? "bg-black text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

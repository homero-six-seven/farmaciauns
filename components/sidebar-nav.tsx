"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BriefcaseMedical,
  CalendarDays,
  IdCard,
  LayoutDashboard,
  ShieldCheck,
  Stethoscope,
  Syringe,
  UserPlus,
  UserSearch,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Role } from "@/lib/authorization";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_ITEMS: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin", label: "Inicio", icon: LayoutDashboard },
    { href: "/admin/medicos", label: "Listado de médicos", icon: Stethoscope },
    { href: "/admin/medicos/nuevo", label: "Alta de médico", icon: UserPlus },
    { href: "/admin/personal", label: "Listado de personal adm.", icon: IdCard },
    {
      href: "/admin/personal/nuevo",
      label: "Alta de personal adm.",
      icon: UserPlus,
    },
    {
      href: "/admin/enfermeras",
      label: "Listado de enfermeras",
      icon: BriefcaseMedical,
    },
    {
      href: "/admin/enfermeras/nuevo",
      label: "Alta de enfermera",
      icon: UserPlus,
    },
    { href: "/pacientes", label: "Búsqueda de pacientes", icon: UserSearch },
  ],
  enfermera: [
    { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
    {
      href: "/inicio#stock-vacunas",
      label: "Stock de vacunas",
      icon: Syringe,
    },
  ],
  medico: [
    { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
    { href: "/inicio#mi-agenda", label: "Mi agenda", icon: CalendarDays },
    { href: "/inicio#mis-coberturas", label: "Mis coberturas", icon: ShieldCheck },
    { href: "/pacientes", label: "Búsqueda de pacientes", icon: UserSearch },
  ],
  paciente: [
    { href: "/inicio", label: "Inicio", icon: LayoutDashboard },
    { href: "/inicio#mi-cobertura", label: "Mi cobertura", icon: ShieldCheck },
  ],
};

/**
 * Sidebar del módulo, con el MISMO estilo visual que la página de inicio
 * (`/inicio`): ítem activo en píldora navy `#141b2b`, links inactivos en
 * `on-surface` con hover suave. Marca el ítem activo según la ruta actual.
 */
export function SidebarNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = NAV_ITEMS[role];
  const activeItem = items
    .filter(
      (item) =>
        !item.href.includes("#") &&
        (pathname === item.href || pathname.startsWith(`${item.href}/`)),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];

  return (
    <nav aria-label="Navegación principal" className="flex flex-col gap-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeItem?.href === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            aria-current={isActive ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors max-[760px]:w-11 max-[760px]:justify-center max-[760px]:overflow-hidden ${
              isActive
                ? "bg-[#141b2b] text-white"
                : "text-on-surface hover:bg-surface-container-low"
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="max-[760px]:hidden">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

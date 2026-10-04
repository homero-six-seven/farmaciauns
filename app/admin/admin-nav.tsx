"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const navItems: NavItem[] = [
  {
    label: "Inicio",
    href: "/admin",
    icon: "dashboard",
  },
  {
    label: "Listado de médicos",
    href: "/admin/medicos",
    icon: "stethoscope",
  },
  {
    label: "Alta de médico",
    href: "/admin/medicos/nuevo",
    icon: "person_add",
  },
  {
    label: "Listado de personal adm.",
    href: "/prototipos/pantalla_23_listado_de_personal_administrativo",
    icon: "badge",
  },
  {
    label: "Alta de personal adm.",
    href: "/prototipos/pantalla_16_alta_de_personal_administrativo",
    icon: "person_add",
  },
  {
    label: "Búsqueda de pacientes",
    href: "/prototipos/pantalla_21_b_squeda_de_pacientes_administrador",
    icon: "person_search",
  },
  {
    label: "Listado de enfermeras",
    href: "/admin/enfermeras",
    icon: "medical_services",
  },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-space-sm pt-space-xs">
      {navItems.map((item) => {
        const isActive =
          item.href === "/admin"
            ? pathname === "/admin"
            : item.href === "/admin/medicos"
            ? pathname === "/admin/medicos"
            : item.href === "/admin/medicos/nuevo"
            ? pathname === "/admin/medicos/nuevo" || pathname.includes("/confirmacion")
            : item.href === "/admin/enfermeras"
            ? pathname === "/admin/enfermeras"
            : pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-space-sm px-space-sm py-space-sm rounded transition-colors font-label-md text-label-md ${
              isActive
                ? "bg-primary-container text-on-primary font-semibold"
                : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

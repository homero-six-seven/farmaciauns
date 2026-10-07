import Link from "next/link";
import {
  BriefcaseMedical,
  IdCard,
  Search,
  Stethoscope,
  UserPlus,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const cards = [
    {
      title: "Listado de médicos",
      href: "/admin/medicos",
      icon: Stethoscope,
    },
    {
      title: "Alta de médico",
      href: "/admin/medicos/nuevo",
      icon: UserPlus,
    },
    {
      title: "Listado de personal administrativo",
      href: "/admin/personal",
      icon: IdCard,
    },
    {
      title: "Alta de personal administrativo",
      href: "/admin/personal/nuevo",
      icon: UserPlus,
    },
    {
      title: "Búsqueda de pacientes",
      href: "/pacientes",
      icon: Search,
    },
    {
      title: "Listado de enfermeras",
      href: "/admin/enfermeras",
      icon: BriefcaseMedical,
    },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-secondary">
          Panel de Control
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          Bienvenido, Administrador
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group flex min-h-[168px] flex-col items-center justify-center rounded-lg border border-surface-container-lowest bg-surface-container-lowest px-5 py-6 text-center shadow-sm transition-all duration-200 hover:bg-surface-container-low hover:shadow-md"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-fixed text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary">
              <c.icon className="h-6 w-6" />
            </div>
            <span className="max-w-[210px] text-sm font-semibold leading-5 text-on-surface transition-colors group-hover:text-primary">
              {c.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

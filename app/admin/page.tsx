import Link from "next/link";

export const dynamic = "force-dynamic";

export default function AdminDashboardPage() {
  const cards = [
    {
      title: "Listado de médicos",
      href: "/admin/medicos",
      icon: "stethoscope",
    },
    {
      title: "Alta de médico",
      href: "/admin/medicos/nuevo",
      icon: "person_add",
    },
    {
      title: "Listado de personal administrativo",
      href: "/prototipos/pantalla_23_listado_de_personal_administrativo",
      icon: "badge",
    },
    {
      title: "Alta de personal administrativo",
      href: "/prototipos/pantalla_16_alta_de_personal_administrativo",
      icon: "group_add",
    },
    {
      title: "Búsqueda de pacientes",
      href: "/prototipos/pantalla_21_b_squeda_de_pacientes_administrador",
      icon: "person_search",
    },
    {
      title: "Listado de enfermeras",
      href: "/admin/enfermeras",
      icon: "medical_services",
    },
  ];

  return (
    <div className="flex flex-col gap-space-lg w-full max-w-[1200px] mx-auto py-space-sm">
      <div className="flex flex-col gap-1">
        <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
          Panel de Control
        </span>
        <h1 className="font-display-lg text-display-lg text-on-surface tracking-tight font-bold">
          Bienvenido, Administrador
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg mt-space-sm">
        {cards.map((c) => (
          <Link
            key={c.title}
            href={c.href}
            className="group flex flex-col items-center justify-center p-space-xl bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:bg-surface-container-low transition-all duration-200 text-center min-h-[220px] border border-outline-variant/20"
          >
            <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-space-md text-on-surface group-hover:bg-primary group-hover:text-on-primary transition-colors duration-200">
              <span className="material-symbols-outlined text-[36px]">{c.icon}</span>
            </div>
            <span className="font-headline-sm text-headline-sm text-on-surface group-hover:text-primary transition-colors font-semibold">
              {c.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

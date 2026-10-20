import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole, roles, type Role } from "@/lib/authorization";
import { AdminLayout } from "@/components/admin-layout";

export default async function InicioPage() {
  const role = await requireRole(roles);
  const user = await currentUser();

  if (role === "admin") {
    redirect("/admin");
  }

  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;
  const cards = portalCards[role];

  return (
    <AdminLayout>
      <section className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondary">
            {portalTitles[role]}
          </p>
          <h1 className="text-2xl font-semibold">
            Bienvenido{displayName ? `, ${displayName}` : ""}
          </h1>
          <p className="text-sm text-on-surface-variant">
            Iniciaste sesión en Sala Médica.
          </p>
        </div>

        <section
          aria-label="Resumen del portal"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {cards.map(({ id, title, description, Icon, href }: PortalCard) => (
            <article
              className="space-y-3 rounded-lg border border-surface-container-high bg-surface-container-lowest p-5"
              id={id}
              key={id}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container text-on-surface">
                <Icon />
              </div>
              <h2 className="text-lg font-semibold">{title}</h2>
              <p className="text-sm text-on-surface-variant">{description}</p>
              {href ? (
                <Link
                  href={href}
                  className="inline-flex h-9 items-center rounded bg-primary px-4 text-xs font-semibold text-on-primary transition-colors hover:bg-secondary"
                >
                  Ir a {title.toLowerCase()}
                </Link>
              ) : (
                <span className="inline-flex rounded-full bg-surface-container px-3 py-1 text-xs font-semibold text-on-surface-variant">
                  Próximamente
                </span>
              )}
            </article>
          ))}
        </section>
      </section>
    </AdminLayout>
  );
}

const portalTitles = {
  admin: "Panel de Administración",
  enfermera: "Portal de Enfermería",
  medico: "Portal Médico",
  paciente: "Portal Paciente",
} satisfies Record<Role, string>;

const portalCards = {
  admin: [],
  enfermera: [
    {
      id: "stock-vacunas",
      title: "Stock de vacunas",
      description:
        "La gestión y consulta del stock de vacunas estará disponible en este espacio.",
      Icon: SyringeIcon,
    },
  ],
  medico: [
    {
      id: "mi-agenda",
      title: "Mi agenda",
      description:
        "Configurá tu disponibilidad y consultá los turnos habilitados de cada mes.",
      Icon: CalendarIcon,
      href: "/medico/agenda",
    },
    {
      id: "mis-coberturas",
      title: "Mis coberturas",
      description:
        "La configuración de las coberturas que aceptás estará disponible en este espacio.",
      Icon: CoverageIcon,
    },
  ],
  paciente: [
    {
      id: "mis-turnos",
      title: "Mis turnos",
      description:
        "Cuando el servicio esté disponible, vas a poder consultar y gestionar tus turnos desde acá.",
      Icon: CalendarIcon,
    },
    {
      id: "historia-clinica",
      title: "Mi historia clínica",
      description:
        "Tu información clínica estará disponible en este espacio cuando se integre la base de datos.",
      Icon: MedicalRecordIcon,
    },
    {
      id: "mi-cobertura",
      title: "Mi cobertura",
      description:
        "La consulta de tu cobertura médica estará disponible en este espacio.",
      Icon: CoverageIcon,
    },
  ],
} satisfies Record<Role, PortalCard[]>;

type PortalCard = {
  id: string;
  title: string;
  description: string;
  Icon: () => React.JSX.Element;
  /** Si la sección ya está disponible, la tarjeta enlaza a ella. */
  href?: string;
};

function CalendarIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13H4V6a1 1 0 0 1 1-1Zm2 8h3m4 0h3m-10 4h3"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CoverageIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3 4.5 6v5.5c0 4.3 3.2 7.7 7.5 9.5 4.3-1.8 7.5-5.2 7.5-9.5V6L12 3Zm-3 8.5 2 2 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SyringeIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="m14 5 5 5M12 7l5 5m-9 9 12-12M6 12l6 6m-8 2 4-4m7-13 5 5M4 20l-1 1m8-14 6 6M4 14l6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MedicalRecordIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 1v4h4m-6 3v7m-3.5-3.5h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

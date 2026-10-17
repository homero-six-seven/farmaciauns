import { UserButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireRole, roles, type Role } from "@/lib/authorization";
import { SidebarNav } from "@/components/sidebar-nav";
import styles from "./inicio.module.css";

export default async function InicioPage() {
  const role = await requireRole(roles);
  const user = await currentUser();

  if (role === "admin") {
    redirect("/admin");
  }

  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;
  const portalTitle = portalTitles[role];
  const cards = portalCards[role];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandIcon}>
            <HospitalIcon />
          </span>
          <span>Sala Médica</span>
        </div>
        <div className={styles.account}>
          {displayName && <span>{displayName}</span>}
          <UserButton />
        </div>
      </header>

      <aside className={styles.sidebar}>
        <div>
          <p className={styles.sidebarLabel}>{portalTitle}</p>
          <SidebarNav role={role} />
        </div>
        <p className={styles.sidebarFooter}>Sistema Sala Médica v1.0</p>
      </aside>

      <main className={styles.main}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>{portalTitle}</p>
          <h1>
            Bienvenido{displayName ? `, ${displayName}` : ""}
          </h1>
          <p>Iniciaste sesión en Sala Médica.</p>
        </section>

        <section aria-label="Resumen del portal" className={styles.cards}>
          {cards.map(({ id, title, description, Icon }) => (
            <article className={styles.card} id={id} key={id}>
              <div className={styles.cardIcon}>
                <Icon />
              </div>
              <h2>{title}</h2>
              <p>{description}</p>
              <span className={styles.status}>Próximamente</span>
            </article>
          ))}
        </section>
      </main>
    </div>
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
        "La agenda médica y los turnos habilitados estarán disponibles en este espacio.",
      Icon: CalendarIcon,
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
} satisfies Record<
  Role,
  {
    id: string;
    title: string;
    description: string;
    Icon: () => React.JSX.Element;
  }[]
>;

function HospitalIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M9 3h6v4h4v14H5V7h4V3Zm0 4h6M12 10v7m-3.5-3.5h7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

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

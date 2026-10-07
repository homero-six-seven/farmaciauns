import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
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
import { requireRole, roles, type Role } from "@/lib/authorization";
import styles from "./inicio.module.css";

type NavItem = { href: string; label: string; icon: LucideIcon };

/**
 * Navegación lateral según rol. Es el "hub" que conecta las rutas
 * implementadas (módulo administrativo y búsqueda de pacientes) con el
 * dashboard de inicio.
 */
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  admin: [
    { href: "/admin/medicos", label: "Listado de médicos", icon: Stethoscope },
    { href: "/admin/medicos/nuevo", label: "Alta de médico", icon: UserPlus },
    { href: "/admin/personal", label: "Listado de personal adm.", icon: IdCard },
    { href: "/admin/personal/nuevo", label: "Alta de personal adm.", icon: UserPlus },
    { href: "/pacientes", label: "Búsqueda de pacientes", icon: UserSearch },
    { href: "/admin/enfermeras", label: "Listado de enfermeras", icon: BriefcaseMedical },
  ],
  medico: [{ href: "/pacientes", label: "Búsqueda de pacientes", icon: UserSearch }],
  enfermera: [],
  paciente: [],
};

const PORTAL_LABEL: Record<Role, string> = {
  admin: "Módulo administrativo",
  medico: "Portal Médico",
  enfermera: "Portal Enfermería",
  paciente: "Portal Paciente",
};

export default async function InicioPage() {
  await auth.protect();
  const role = await requireRole(roles);

  const user = await currentUser();
  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;

  const navItems = NAV_BY_ROLE[role];
  const portalLabel = PORTAL_LABEL[role];

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
          <p className={styles.sidebarLabel}>{portalLabel}</p>
          <nav aria-label="Navegación principal">
            <span aria-current="page" className={styles.activeNav}>
              <LayoutDashboard className={styles.navIcon} />
              Inicio
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={styles.navLink}>
                  <Icon className={styles.navIcon} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <p className={styles.sidebarFooter}>Sistema Sala Médica v1.0</p>
      </aside>

      <main className={styles.main}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>{portalLabel}</p>
          <h1>
            Bienvenido{displayName ? `, ${displayName}` : ""}
          </h1>
          <p>Iniciaste sesión en Sala Médica.</p>
        </section>

        <section aria-label="Accesos del portal" className={styles.cards}>
          {role === "admin" && (
            <>
              <ActionCard
                href="/admin/medicos"
                title="Listado de médicos"
                description="Nómina del cuerpo médico, filtrable por especialidad y estado."
                icon={Stethoscope}
              />
              <ActionCard
                href="/admin/medicos/nuevo"
                title="Alta de médico"
                description="Incorporá un nuevo profesional al cuerpo médico."
                icon={UserPlus}
              />
              <ActionCard
                href="/admin/personal"
                title="Listado de personal adm."
                description="Nómina del personal de admisiones, recepción y secretaría."
                icon={IdCard}
              />
              <ActionCard
                href="/admin/personal/nuevo"
                title="Alta de personal adm."
                description="Registrá un nuevo agente administrativo en el sistema."
                icon={UserPlus}
              />
              <ActionCard
                href="/pacientes"
                title="Búsqueda de pacientes"
                description="Consulta y verificación de fichas de pacientes en el padrón."
                icon={UserSearch}
              />
              <ActionCard
                href="/admin/enfermeras"
                title="Listado de enfermeras"
                description="Nómina institucional del personal de enfermería."
                icon={BriefcaseMedical}
              />
            </>
          )}

          {role === "medico" && (
            <ActionCard
              href="/pacientes"
              title="Búsqueda de pacientes"
              description="Consulta y verificación de fichas de pacientes en el padrón."
              icon={UserSearch}
            />
          )}

          {(role === "paciente" || role === "enfermera") && (
            <>
              <article className={styles.card}>
                <div className={styles.cardIcon}>
                  <CalendarIcon />
                </div>
                <h2>Mis turnos</h2>
                <p>
                  Cuando el servicio esté disponible, vas a poder consultar y
                  gestionar tus turnos desde acá.
                </p>
                <span className={styles.status}>Próximamente</span>
              </article>

              <article className={styles.card}>
                <div className={styles.cardIcon}>
                  <MedicalRecordIcon />
                </div>
                <h2>Mi historia clínica</h2>
                <p>
                  Tu información clínica estará disponible en este espacio
                  cuando se integre la base de datos.
                </p>
                <span className={styles.status}>Próximamente</span>
              </article>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

function ActionCard({
  href,
  title,
  description,
  icon: Icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Link href={href} className={`${styles.card} ${styles.cardLink}`}>
      <div>
        <div className={styles.cardIcon}>
          <Icon />
        </div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <span aria-hidden="true" className={styles.cardLinkArrow}>
        →
      </span>
    </Link>
  );
}

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

import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireRole, roles } from "@/lib/authorization";
import { getPrisma } from "@/lib/prisma";
import { AppShell } from "@/components/app-shell";
import styles from "./inicio.module.css";

export default async function InicioPage() {
  await auth.protect();
  await requireRole(roles);
  const user = await currentUser();

  const clerkRole = (user?.publicMetadata?.role as string | undefined)?.toLowerCase();
  if (clerkRole === "admin" || clerkRole === "administrador") {
    redirect("/admin");
  }

  const prisma = getPrisma();
  const dbUser = await prisma.user.findFirst({
    where: {
      OR: [
        { clerkId: user?.id },
        ...(user?.emailAddresses?.[0]?.emailAddress
          ? [{ email: user.emailAddresses[0].emailAddress.toLowerCase() }]
          : []),
      ],
    },
  });

  if (dbUser?.role === "ADMINISTRADOR") {
    redirect("/admin");
  }

  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;

  const esMedico = dbUser?.role === "MEDICO";
  const esEnfermera = dbUser?.role === "ENFERMERA";

  const portalLabel = esMedico
    ? "Portal Médico"
    : esEnfermera
      ? "Portal Enfermería"
      : "Portal Paciente";

  return (
    <AppShell>
      <div className={`${styles.page} mx-auto w-full max-w-6xl`}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>{portalLabel}</p>
          <h1>Bienvenido{displayName ? `, ${displayName}` : ""}</h1>
          <p>Iniciaste sesión en Sala Médica.</p>
        </section>

        <section aria-label="Accesos del portal" className={styles.cards}>
          {esMedico ? (
            <>
              <Link href="/medico/agenda" className={styles.card}>
                <div className={styles.cardIcon}>
                  <CalendarIcon />
                </div>
                <h2>Mi agenda</h2>
                <p>
                  Configurá tu disponibilidad y consultá los turnos
                  habilitados de cada mes.
                </p>
                <span className={styles.status}>Disponible</span>
              </Link>
              <Link href="/coberturas" className={styles.card}>
                <div className={styles.cardIcon}>
                  <ShieldIcon />
                </div>
                <h2>Mis coberturas</h2>
                <p>
                  Administrá las obras sociales y coberturas médicas que
                  aceptás.
                </p>
                <span className={styles.status}>Disponible</span>
              </Link>
              <Link href="/pacientes" className={styles.card}>
                <div className={styles.cardIcon}>
                  <SearchIcon />
                </div>
                <h2>Búsqueda de pacientes</h2>
                <p>Consultá las fichas y la cobertura de los pacientes.</p>
                <span className={styles.status}>Disponible</span>
              </Link>
            </>
          ) : esEnfermera ? (
            <Link href="/stock" className={styles.card}>
              <div className={styles.cardIcon}>
                <SyringeIcon />
              </div>
              <h2>Stock de vacunas</h2>
              <p>
                Consultá las unidades disponibles y registrá ingresos y
                egresos.
              </p>
              <span className={styles.status}>Disponible</span>
            </Link>
          ) : (
            <>
              <Link href="/cobertura" className={styles.card}>
                <div className={styles.cardIcon}>
                  <ShieldIcon />
                </div>
                <h2>Mi cobertura</h2>
                <p>
                  Consultá y registrá tu cobertura médica y tu número de
                  afiliado.
                </p>
                <span className={styles.status}>Disponible</span>
              </Link>

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
      </div>
    </AppShell>
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

function ShieldIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9 12l2 2 4-4"
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
        d="M18 2l4 4M17 4l3 3M19 9l-8 8-4-4 8-8 4 4ZM12 15l-3-3M9 18l-3-3 2-2 4 4-3 1Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle
        cx="11"
        cy="11"
        r="7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M21 21l-4.35-4.35"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

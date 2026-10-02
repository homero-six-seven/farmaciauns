import { UserButton } from "@clerk/nextjs";
import { auth, currentUser } from "@clerk/nextjs/server";
import styles from "./inicio.module.css";

export default async function InicioPage() {
  await auth.protect();
  const user = await currentUser();
  const displayName =
    user?.firstName ?? user?.username ?? user?.emailAddresses[0]?.emailAddress;

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
          <p className={styles.sidebarLabel}>Portal Paciente</p>
          <nav aria-label="Navegación del paciente">
            <span aria-current="page" className={styles.activeNav}>
              <DashboardIcon />
              Inicio
            </span>
          </nav>
        </div>
        <p className={styles.sidebarFooter}>Sistema Sala Médica v1.0</p>
      </aside>

      <main className={styles.main}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>Portal Paciente</p>
          <h1>
            Bienvenido{displayName ? `, ${displayName}` : ""}
          </h1>
          <p>Iniciaste sesión en Sala Médica.</p>
        </section>

        <section aria-label="Resumen del portal" className={styles.cards}>
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
              Tu información clínica estará disponible en este espacio cuando
              se integre la base de datos.
            </p>
            <span className={styles.status}>Próximamente</span>
          </article>
        </section>
      </main>
    </div>
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

function DashboardIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path
        d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.7"
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

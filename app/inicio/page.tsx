import Link from "next/link";
import { Syringe } from "lucide-react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { requireRole, roles } from "@/lib/authorization";
import { getPrisma } from "@/lib/prisma";
import { listarVacunas } from "@/lib/stock-service";
import {
  MSG_AVISO_STOCK_BAJO,
  MSG_AVISO_STOCK_BAJO_DETALLE,
  MSG_STOCK_BAJO,
  esStockBajo,
} from "@/lib/domain/vacuna";
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

  // US-36: aviso de stock bajo en el Inicio de la enfermera (CA2).
  const vacunasBajoStock = esEnfermera
    ? (await listarVacunas()).filter((v) => esStockBajo(v.stockActual))
    : [];

  return (
    <AppShell>
      <div className={`${styles.page} mx-auto w-full max-w-6xl`}>
        <section className={styles.welcome}>
          <p className={styles.eyebrow}>{portalLabel}</p>
          <h1>Bienvenido{displayName ? `, ${displayName}` : ""}</h1>
          <p>Iniciaste sesión en Sala Médica.</p>
        </section>

        {esEnfermera && vacunasBajoStock.length > 0 && (
          <section
            role="alert"
            aria-label="Alerta de stock bajo"
            className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[22px] text-amber-700">
                warning
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-amber-900">
                  {MSG_AVISO_STOCK_BAJO}
                </p>
                <p className="text-xs text-amber-800">
                  {MSG_AVISO_STOCK_BAJO_DETALLE}
                </p>
              </div>
            </div>
            <ul className="mt-3 flex flex-col gap-2">
              {vacunasBajoStock.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-1 rounded-lg bg-white/70 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm font-medium text-on-surface">
                    {v.nombre}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span className="font-mono text-xs text-on-surface-variant">
                      {v.stockActual} unidades disponibles
                    </span>
                    <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-amber-800">
                      {MSG_STOCK_BAJO}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section aria-label="Accesos del portal" className={styles.cards}>
          {esMedico ? (
            <>
              <Link href="/medico/agenda" className={`${styles.card} ${styles.cardLink}`}>
                <div className={styles.cardIcon}>
                  <CalendarIcon />
                </div>
                <h2>Mi agenda</h2>
                <p>
                  Configurá tu disponibilidad y consultá los turnos
                  habilitados de cada mes.
                </p>
              </Link>
              <Link href="/coberturas" className={`${styles.card} ${styles.cardLink}`}>
                <div className={styles.cardIcon}>
                  <ShieldIcon />
                </div>
                <h2>Mis coberturas</h2>
                <p>
                  Administrá las obras sociales y coberturas médicas que
                  aceptás.
                </p>
              </Link>
              <Link href="/pacientes" className={`${styles.card} ${styles.cardLink}`}>
                <div className={styles.cardIcon}>
                  <SearchIcon />
                </div>
                <h2>Búsqueda de pacientes</h2>
                <p>Consultá las fichas y la cobertura de los pacientes.</p>
              </Link>
            </>
          ) : esEnfermera ? (
            <Link href="/stock" className={`${styles.card} ${styles.cardLink}`}>
              <div className={styles.cardIcon}>
                <Syringe aria-hidden="true" />
              </div>
              <h2>Stock de vacunas</h2>
              <p>
                Consultá las unidades disponibles y registrá ingresos y
                egresos.
              </p>
            </Link>
          ) : (
            <>
              <Link href="/cobertura" className={`${styles.card} ${styles.cardLink}`}>
                <div className={styles.cardIcon}>
                  <ShieldIcon />
                </div>
                <h2>Mis datos</h2>
                <p>
                  Actualizá tus datos de contacto y cobertura médica.
                </p>
              </Link>

              <Link href="/turnos" className={`${styles.card} ${styles.cardLink}`}>
                <div className={styles.cardIcon}>
                  <CalendarIcon />
                </div>
                <h2>Mis turnos</h2>
                <p>
                  Reservá un turno con un médico y consultá o cancelá tus
                  turnos.
                </p>
              </Link>

              <Link href="/historia-clinica" className={`${styles.card} ${styles.cardLink}`}>
                <div className={styles.cardIcon}>
                  <MedicalRecordIcon />
                </div>
                <h2>Mi historia clínica</h2>
                <p>
                  Consultá los diagnósticos y tratamientos que registraron tus
                  médicos.
                </p>
              </Link>
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

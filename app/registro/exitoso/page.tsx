import Link from "next/link";

/**
 * US-06 — Confirmación de registro + pantalla de ingreso.
 * Muestra el mensaje de éxito exacto y un enlace para iniciar sesión
 * (el login real lo implementa otro equipo; acá se enlaza al mockup).
 */
export default function RegistroExitosoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface px-6 text-on-surface">
      <div className="flex w-full max-w-md flex-col">
        <div className="flex flex-col rounded-xl bg-surface-container-lowest p-8 shadow-md">
          <div
            role="status"
            aria-live="polite"
            className="mb-6 flex items-start gap-3 rounded-lg bg-surface-container-low p-4"
          >
            <span
              className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary"
              aria-hidden="true"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <p className="text-sm font-semibold text-on-surface">
              Cuenta creada correctamente. Ya podés iniciar sesión.
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Ingresá a tu cuenta clínica para continuar
          </p>

          <Link
            href="/pantalla_1_iniciar_sesi_n"
            className="mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
          >
            Ingresar
          </Link>
        </div>

        <div className="mt-6 text-center text-sm text-on-surface-variant">
          ¿Sos paciente y no tenés cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-on-surface underline underline-offset-4"
          >
            Registrate
          </Link>
        </div>
      </div>
    </main>
  );
}

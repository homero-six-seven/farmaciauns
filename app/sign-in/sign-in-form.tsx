"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isCompromisedPasswordError } from "../../lib/clerk-error-message";
import styles from "./sign-in-form.module.css";

type SignInFormProps = {
  initialError?: boolean;
  initialErrorMessage?: string;
};

export function SignInForm({
  initialError = false,
  initialErrorMessage,
}: SignInFormProps) {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    initialErrorMessage ??
      (initialError ? "Email o contraseña incorrectos" : ""),
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      const { error } = await signIn.password({
        identifier: email,
        password,
      });

      if (error) {
        const reason =
          isCompromisedPasswordError(error)
            ? "compromised-password"
            : error.code === "form_password_incorrect" ||
                error.code === "form_identifier_not_found"
              ? "credentials"
              : "service";
        router.push(`/sign-in/error?reason=${reason}`);
        return;
      }

      if (signIn.status === "complete") {
        try {
          const { error: finalizeError } = await signIn.finalize({
            navigate: ({ session, decorateUrl }) => {
              const destination = session?.currentTask
                ? `/sign-in/tasks/${session.currentTask.key}`
                : "/inicio";
              const url = decorateUrl(destination);

              if (url.startsWith("http")) {
                window.location.href = url;
              } else {
                router.push(url);
              }
            },
          });

          if (finalizeError) {
            router.push("/sign-in/error?reason=finalize");
          }
        } catch {
          router.push("/sign-in/error?reason=finalize");
        }
        return;
      }

      setErrorMessage("Tu cuenta requiere una verificación adicional.");
    } catch {
      router.push("/sign-in/error?reason=service");
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <span className={styles.brandIcon} aria-hidden="true">
            <HospitalIcon />
          </span>
          <span className={styles.brandName}>Sala Médica</span>
        </div>
        <div className={styles.terminal}>
          <span className={styles.terminalDot} />
          <span>Terminal Clínico v2.4</span>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.content} aria-labelledby="sign-in-title">
          <div className={styles.card}>
            <div className={styles.cardBrand}>
              <span className={styles.cardBrandIcon} aria-hidden="true">
                <HospitalIcon />
              </span>
              <span>Sala Médica</span>
            </div>

            <div className={styles.intro}>
              <h1 id="sign-in-title">Iniciar sesión</h1>
              <p>Ingresá a tu cuenta clínica para continuar</p>
            </div>

            {errorMessage && (
              <div className={styles.errorBanner} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">
                  <ReportIcon />
                </span>
                <div>
                  <strong>Acceso denegado</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <input
                  autoComplete="email"
                  className={errorMessage ? styles.inputError : undefined}
                  id="email"
                  name="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Contraseña</label>
                <div className={styles.passwordInput}>
                  <input
                    autoComplete="current-password"
                    className={errorMessage ? styles.inputError : undefined}
                    id="password"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingresá tu contraseña"
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <button
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className={styles.visibilityButton}
                    onClick={() => setShowPassword((visible) => !visible)}
                    type="button"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </button>
                </div>
              </div>

              <div className={styles.forgotPassword}>
                <Link href="/recuperar-contrasena">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                className={styles.submitButton}
                disabled={fetchStatus === "fetching"}
                type="submit"
              >
                {fetchStatus === "fetching" ? "Ingresando..." : "Ingresar"}
              </button>
            </form>

            {initialError && (
              <Link className={styles.retryLink} href="/sign-in">
                Volver a intentar
              </Link>
            )}
          </div>

          <p className={styles.registerPrompt}>
            ¿Sos paciente y no tenés cuenta?{" "}
            <Link href="/sign-up">Registrate</Link>
          </p>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerDetails}>
          <span>© 2026 Sala Médica. Sistema de Triage y Gestión Clínica.</span>
          <span>Acceso Restringido a Personal Autorizado</span>
        </div>
        <div className={styles.footerLinks}>
          <span>Soporte Técnico</span>
        </div>
      </footer>
    </div>
  );
}

function HospitalIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
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

function ReportIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M12 8v5m0 3h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3l-7.5-13.1a2 2 0 0 0-3.4 0Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function VisibilityIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function VisibilityOffIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="20" viewBox="0 0 24 24" width="20">
      <path
        d="m3 3 18 18M10.6 6.1A10.8 10.8 0 0 1 12 6c6.4 0 10 6 10 6a15 15 0 0 1-3 3.5M6.2 6.2C3.5 8 2 12 2 12s3.6 6 10 6c1.2 0 2.3-.2 3.3-.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
      <path
        d="M9.9 9.9a3 3 0 0 0 4.2 4.2"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

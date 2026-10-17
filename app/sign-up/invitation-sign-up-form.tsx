"use client";

import { useSignUp } from "@clerk/nextjs";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { linkCurrentInvitedStaffAccount } from "./actions";
import { clerkErrorMessage } from "../../lib/clerk-error-message";
import styles from "../sign-in/sign-in-form.module.css";

export function InvitationSignUpForm({ ticket }: { ticket: string }) {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [linking, setLinking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function retryAccountLink() {
    setError("");
    setLinking(true);

    try {
      const result = await linkCurrentInvitedStaffAccount();
      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push("/inicio");
    } catch {
      setError(
        "La cuenta se creó, pero no se pudo vincular al sistema. Intentá nuevamente.",
      );
    } finally {
      setLinking(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      setSubmitting(false);
      return;
    }

    try {
      const { error: ticketError } = await signUp.ticket({ ticket });
      if (ticketError) {
        setError(clerkErrorMessage(ticketError, "La invitación no es válida."));
        return;
      }

      const { error: passwordError } = await signUp.password({ password });
      if (passwordError) {
        setError(
          clerkErrorMessage(
            passwordError,
            "No se pudo definir la contraseña. Revisá los requisitos.",
          ),
        );
        return;
      }

      const { error: finalizeError } = await signUp.finalize({
        navigate: async ({ decorateUrl }) => {
          setAccountCreated(true);
          const result = await linkCurrentInvitedStaffAccount();

          if (!result.success) {
            setError(result.message);
            return;
          }

          const url = decorateUrl("/inicio");
          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });
      if (finalizeError) {
        setError(clerkErrorMessage(finalizeError, "No se pudo iniciar sesión."));
      }
    } catch {
      setError("No se pudo completar el alta. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
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
          <span>Activación de cuenta</span>
        </div>
      </header>

      <main className={`${styles.main} ${styles.invitationMain}`}>
        <section
          className={`${styles.content} ${styles.invitationContent}`}
          aria-labelledby="invitation-title"
        >
          <div className={`${styles.card} ${styles.invitationCard}`}>
            <div className={styles.cardBrand}>
              <span className={styles.cardBrandIcon} aria-hidden="true">
                <HospitalIcon />
              </span>
              <span>Sala Médica</span>
            </div>

            <div className={styles.intro}>
              <h1 id="invitation-title">Definir contraseña</h1>
              <p>Elegí una contraseña personal para activar tu cuenta.</p>
            </div>
            {accountCreated ? (
              <div className={styles.form}>
                {error && (
                  <div className={styles.errorBanner} role="alert">
                    <p>{error}</p>
                  </div>
                )}
                <button
                  className={styles.invitationSubmitButton}
                  disabled={linking}
                  onClick={retryAccountLink}
                  type="button"
                >
                  {linking ? "Vinculando..." : "Reintentar vinculación"}
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className={styles.errorBanner} role="alert">
                    <p>{error}</p>
                  </div>
                )}
                <form className={styles.form} onSubmit={handleSubmit}>
                  <div className={styles.field}>
                    <label htmlFor="invitation-password">Contraseña</label>
                    <div className={`${styles.passwordInput} ${styles.invitationPassword}`}>
                      <input
                        autoComplete="new-password"
                        id="invitation-password"
                        minLength={8}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Ingresá una contraseña (mínimo 8 caracteres)"
                        required
                        type={showPassword ? "text" : "password"}
                        value={password}
                      />
                      <button
                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        className={styles.visibilityButton}
                        onClick={() => setShowPassword((visible) => !visible)}
                        type="button"
                      >
                        {showPassword ? (
                          <EyeOff aria-hidden="true" size={18} />
                        ) : (
                          <Eye aria-hidden="true" size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className={styles.field}>
                    <label htmlFor="invitation-confirmation">
                      Confirmar contraseña
                    </label>
                    <div className={`${styles.passwordInput} ${styles.invitationPassword}`}>
                      <input
                        autoComplete="new-password"
                        id="invitation-confirmation"
                        minLength={8}
                        onChange={(event) => setConfirmation(event.target.value)}
                        placeholder="Volvé a ingresar la contraseña"
                        required
                        type={showConfirmation ? "text" : "password"}
                        value={confirmation}
                      />
                      <button
                        aria-label={
                          showConfirmation
                            ? "Ocultar confirmación de contraseña"
                            : "Mostrar confirmación de contraseña"
                        }
                        className={styles.visibilityButton}
                        onClick={() => setShowConfirmation((visible) => !visible)}
                        type="button"
                      >
                        {showConfirmation ? (
                          <EyeOff aria-hidden="true" size={18} />
                        ) : (
                          <Eye aria-hidden="true" size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                  <button
                    className={styles.invitationSubmitButton}
                    disabled={submitting || fetchStatus === "fetching"}
                    type="submit"
                  >
                    {submitting || fetchStatus === "fetching"
                      ? "Activando cuenta..."
                      : "Activar cuenta"}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerDetails}>
          <span>Sala Médica · Sistema de Triage y Gestión Clínica</span>
          <span>Acceso para personal autorizado</span>
        </div>
        <div className={styles.footerLinks}>
          <span>Activación segura de cuenta</span>
        </div>
      </footer>
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

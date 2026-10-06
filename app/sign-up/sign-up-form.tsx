"use client";

import { useSignUp } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clerkErrorMessage } from "../../lib/clerk-error-message";
import styles from "../sign-in/sign-in-form.module.css";

export function SignUpForm() {
  const { signUp, fetchStatus } = useSignUp();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dni, setDni] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function finalizeSignUp() {
    try {
      const { error } = await signUp.finalize({
        navigate: ({ session, decorateUrl }) => {
          const destination = session?.currentTask
            ? `/sign-up/tasks/${session.currentTask.key}`
            : "/inicio";
          const url = decorateUrl(destination);

          if (url.startsWith("http")) {
            window.location.href = url;
          } else {
            router.push(url);
          }
        },
      });

      if (error) {
        setErrorMessage(
          `La cuenta se creó, pero no se pudo iniciar la sesión. ${clerkErrorMessage(
            error,
            "Volvé a iniciar sesión.",
          )}`,
        );
      }
    } catch {
      setErrorMessage(
        "La cuenta se creó, pero no se pudo iniciar la sesión automáticamente. Volvé a iniciar sesión.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    try {
      const { error } = await signUp.password({
        emailAddress: email,
        password,
        firstName,
        lastName,
      });

      if (error) {
        setErrorMessage(
          clerkErrorMessage(
            error,
            "No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.",
          ),
        );
        return;
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      if (signUp.unverifiedFields.includes("email_address")) {
        const { error: verificationError } =
          await signUp.verifications.sendEmailCode();

        if (verificationError) {
          setErrorMessage(
            clerkErrorMessage(
              verificationError,
              "No se pudo enviar el código de verificación. Intentá de nuevo.",
            ),
          );
          return;
        }

        setAwaitingVerification(true);
        return;
      }

      setErrorMessage(
        "La configuración de registro necesita campos adicionales. Contactá al administrador.",
      );
    } catch {
      setErrorMessage("Ocurrió un error inesperado. Intentá de nuevo.");
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    try {
      const { error } = await signUp.verifications.verifyEmailCode({
        code: verificationCode,
      });

      if (error) {
        setErrorMessage(
          clerkErrorMessage(
            error,
            "El código no es válido. Revisalo e intentá de nuevo.",
          ),
        );
        return;
      }

      if (signUp.status === "complete") {
        await finalizeSignUp();
        return;
      }

      setErrorMessage(
        "La cuenta necesita completar requisitos adicionales. Contactá al administrador.",
      );
    } catch {
      setErrorMessage("No se pudo verificar el código. Intentá de nuevo.");
    }
  }

  async function resendVerificationCode() {
    setErrorMessage("");

    try {
      const { error } = await signUp.verifications.sendEmailCode();

      if (error) {
        setErrorMessage(
          clerkErrorMessage(
            error,
            "No se pudo reenviar el código. Esperá un momento e intentá de nuevo.",
          ),
        );
      }
    } catch {
      setErrorMessage("No se pudo reenviar el código. Intentá de nuevo.");
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
        <section className={styles.content} aria-labelledby="sign-up-title">
          <div className={styles.registrationTopbar}>
            <span>Paso 01 / Alta de usuario en terminal</span>
            <p>
              ¿Ya tenés cuenta? <Link href="/sign-in">Iniciar sesión</Link>
            </p>
          </div>

          <div className={`${styles.card} ${styles.registrationCard}`}>
            <div className={styles.registrationHeader}>
              <div className={styles.registrationHeaderTitle}>
                <div>
                  <span>Formulario oficial</span>
                  <h1 id="sign-up-title">
                    {awaitingVerification
                      ? "Verificá tu email"
                      : "Registro de paciente"}
                  </h1>
                </div>
                <span className={styles.registrationBadge}>
                  <HospitalIcon />
                  Ficha Digital Unificada
                </span>
              </div>
              <p>
                {awaitingVerification
                  ? `Ingresá el código que enviamos a ${email}.`
                  : "Ingresá tus datos personales para habilitar la historia clínica y la gestión de turnos."}
              </p>
            </div>

            <div className={styles.registrationBody}>
              {errorMessage && (
                <div className={styles.errorBanner} role="alert">
                  <span className={styles.errorIcon} aria-hidden="true">
                    <ReportIcon />
                  </span>
                  <div>
                    <strong>Revisá la información ingresada</strong>
                    <p>{errorMessage}</p>
                  </div>
                </div>
              )}

              {awaitingVerification ? (
                <form className={styles.form} onSubmit={handleVerify}>
                  <div className={styles.field}>
                    <label htmlFor="verification-code">
                      Código de verificación
                    </label>
                    <input
                      autoComplete="one-time-code"
                      id="verification-code"
                      inputMode="numeric"
                      onChange={(event) =>
                        setVerificationCode(event.target.value)
                      }
                      placeholder="Ingresá el código del email"
                      required
                      value={verificationCode}
                    />
                  </div>
                  <button
                    className={styles.submitButton}
                    disabled={fetchStatus === "fetching"}
                    type="submit"
                  >
                    {fetchStatus === "fetching"
                      ? "Verificando..."
                      : "Verificar email"}
                  </button>
                  <button
                    className={styles.secondaryButton}
                    disabled={fetchStatus === "fetching"}
                    onClick={resendVerificationCode}
                    type="button"
                  >
                    Reenviar código
                  </button>
                  <button
                    className={styles.secondaryButton}
                    onClick={() => {
                      setAwaitingVerification(false);
                      setErrorMessage("");
                    }}
                    type="button"
                  >
                    Volver al formulario
                  </button>
                </form>
              ) : (
                <form className={styles.form} onSubmit={handleSubmit}>
                  <div className={styles.registrationGrid}>
                    <div className={styles.registrationColumn}>
                      <div className={styles.field}>
                        <label htmlFor="first-name">
                          <span>Nombre <b>*</b></span>
                          <small>Requerido</small>
                        </label>
                        <input
                          autoComplete="given-name"
                          id="first-name"
                          onChange={(event) => setFirstName(event.target.value)}
                          placeholder="Ej. Juan Carlos"
                          required
                          value={firstName}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="dni">
                          <span>DNI <b>*</b></span>
                          <small>Sin puntos · mínimo 7 dígitos</small>
                        </label>
                        <input
                          autoComplete="off"
                          id="dni"
                          inputMode="numeric"
                          minLength={7}
                          maxLength={8}
                          onChange={(event) => setDni(event.target.value.replace(/\D/g, ""))}
                          placeholder="Ej. 38450912"
                          required
                          value={dni}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="email">
                          <span>Email <b>*</b></span>
                        </label>
                        <input
                          autoComplete="email"
                          id="email"
                          onChange={(event) => setEmail(event.target.value)}
                          placeholder="ejemplo@correo.com"
                          required
                          type="email"
                          value={email}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="password">
                          <span>Contraseña <b>*</b></span>
                        </label>
                        <div className={styles.passwordInput}>
                          <input
                            autoComplete="new-password"
                            id="password"
                            minLength={8}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="••••••••••••"
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
                            onClick={() =>
                              setShowPassword((visible) => !visible)
                            }
                            type="button"
                          >
                            {showPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </button>
                        </div>
                        <p className={styles.fieldHelp}>Mínimo 8 caracteres</p>
                      </div>
                    </div>

                    <div className={styles.registrationColumn}>
                      <div className={styles.field}>
                        <label htmlFor="last-name">
                          <span>Apellido <b>*</b></span>
                          <small>Requerido</small>
                        </label>
                        <input
                          autoComplete="family-name"
                          id="last-name"
                          onChange={(event) => setLastName(event.target.value)}
                          placeholder="Ej. González"
                          required
                          value={lastName}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="birth-date">
                          <span>Fecha de nacimiento <b>*</b></span>
                        </label>
                        <input
                          autoComplete="bday"
                          id="birth-date"
                          inputMode="numeric"
                          onChange={(event) => setBirthDate(event.target.value)}
                          placeholder="DD/MM/AAAA"
                          required
                          value={birthDate}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="phone">
                          <span>Teléfono <b>*</b></span>
                          <small>Móvil preferente</small>
                        </label>
                        <input
                          autoComplete="tel"
                          id="phone"
                          onChange={(event) => setPhone(event.target.value.replace(/[^\d+\s()-]/g, ""))}
                          placeholder="Ej. 11 4589 2200"
                          required
                          type="tel"
                          value={phone}
                        />
                      </div>
                      <div className={styles.field}>
                        <label htmlFor="confirm-password">
                          <span>Confirmar contraseña <b>*</b></span>
                        </label>
                        <div className={styles.passwordInput}>
                          <input
                            autoComplete="new-password"
                            id="confirm-password"
                            minLength={8}
                            onChange={(event) =>
                              setConfirmPassword(event.target.value)
                            }
                            placeholder="••••••••••••"
                            required
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                          />
                          <button
                            aria-label={
                              showConfirmPassword
                                ? "Ocultar confirmación"
                                : "Mostrar confirmación"
                            }
                            className={styles.visibilityButton}
                            onClick={() =>
                              setShowConfirmPassword((visible) => !visible)
                            }
                            type="button"
                          >
                            {showConfirmPassword ? (
                              <VisibilityOffIcon />
                            ) : (
                              <VisibilityIcon />
                            )}
                          </button>
                        </div>
                        <p className={styles.fieldHelp}>
                          Debe coincidir con la contraseña
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={styles.registrationActions}>
                    <button
                      className={styles.submitButton}
                      disabled={fetchStatus === "fetching"}
                      type="submit"
                    >
                      {fetchStatus === "fetching"
                        ? "Creando cuenta..."
                        : (
                          <>
                            Registrarme
                            <ArrowForwardIcon />
                          </>
                        )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <p className={styles.registrationDisclaimer}>
            Toda información suministrada reviste carácter de declaración jurada
            bajo estándares de protección clínica nacional.
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
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
      <path
        d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <circle
        cx="12"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function VisibilityOffIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
    >
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

function ArrowForwardIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="18"
      viewBox="0 0 24 24"
      width="18"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

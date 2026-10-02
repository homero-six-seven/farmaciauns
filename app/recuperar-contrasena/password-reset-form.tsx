"use client";

import { useSignIn } from "@clerk/nextjs";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { clerkErrorMessage } from "../../lib/clerk-error-message";
import styles from "../sign-in/sign-in-form.module.css";

type ResetStep = "email" | "code" | "password" | "done";

export function PasswordResetForm() {
  const { signIn, fetchStatus } = useSignIn();
  const router = useRouter();
  const [step, setStep] = useState<ResetStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notice, setNotice] = useState("");

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNotice("");

    try {
      const { error: createError } = await signIn.create({
        identifier: email,
      });

      if (createError) {
        setErrorMessage(
          "No se pudo iniciar la recuperación. Verificá el email e intentá de nuevo.",
        );
        return;
      }

      const { error: sendError } =
        await signIn.resetPasswordEmailCode.sendCode();

      if (sendError) {
        setErrorMessage(
          clerkErrorMessage(
            sendError,
            "No se pudo enviar el código. Esperá un momento e intentá de nuevo.",
          ),
        );
        return;
      }

      setStep("code");
      setNotice("Si el email corresponde a una cuenta, recibirás un código.");
    } catch {
      setErrorMessage(
        "No se pudo iniciar la recuperación. Intentá de nuevo más tarde.",
      );
    }
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setNotice("");

    try {
      const { error } = await signIn.resetPasswordEmailCode.verifyCode({
        code,
      });

      if (error) {
        setErrorMessage(
          clerkErrorMessage(
            error,
            "El código no es válido o venció. Revisalo e intentá de nuevo.",
          ),
        );
        return;
      }

      if (signIn.status !== "needs_new_password") {
        setErrorMessage(
          "No se pudo validar el código para cambiar la contraseña.",
        );
        return;
      }

      setStep("password");
    } catch {
      setErrorMessage("No se pudo validar el código. Intentá de nuevo.");
    }
  }

  async function handleSetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    let passwordUpdated = false;

    try {
      const { error } = await signIn.resetPasswordEmailCode.submitPassword({
        password,
      });

      if (error) {
        setErrorMessage(
          clerkErrorMessage(
            error,
            "No se pudo actualizar la contraseña. Revisá que cumpla los requisitos e intentá de nuevo.",
          ),
        );
        return;
      }

      passwordUpdated = true;

      if (signIn.status === "complete") {
        const { error: finalizeError } = await signIn.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl("/inicio");

            if (url.startsWith("http")) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });

        if (finalizeError) {
          setStep("done");
          setNotice(
            `Tu contraseña fue actualizada. ${clerkErrorMessage(
              finalizeError,
              "No se pudo iniciar la sesión automáticamente; volvé a ingresar con tu nueva contraseña.",
            )}`,
          );
        }
        return;
      }

      setStep("done");
      setNotice(
        "Tu contraseña fue actualizada. Volvé a iniciar sesión con tu nueva contraseña para completar el acceso.",
      );
    } catch {
      if (passwordUpdated) {
        setStep("done");
        setNotice(
          "Tu contraseña fue actualizada. Volvé a iniciar sesión con tu nueva contraseña.",
        );
      } else {
        setErrorMessage(
          "No se pudo actualizar la contraseña. Intentá de nuevo más tarde.",
        );
      }
    }
  }

  const titles: Record<ResetStep, string> = {
    email: "Recuperar contraseña",
    code: "Verificar email",
    password: "Definir contraseña nueva",
    done: "Contraseña actualizada",
  };

  const descriptions: Record<ResetStep, string> = {
    email: "Te enviaremos un código para restablecer el acceso a tu cuenta.",
    code: `Ingresá el código que enviamos a ${email}.`,
    password: "Elegí una contraseña nueva para tu cuenta.",
    done: "El proceso de recuperación finalizó.",
  };

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
        <section
          className={styles.content}
          aria-labelledby="password-reset-title"
        >
          <div className={styles.card}>
            <div className={styles.cardBrand}>
              <span className={styles.cardBrandIcon} aria-hidden="true">
                <HospitalIcon />
              </span>
              <span>Sala Médica</span>
            </div>

            <div className={styles.intro}>
              <h1 id="password-reset-title">{titles[step]}</h1>
              <p>{descriptions[step]}</p>
            </div>

            {errorMessage && (
              <div className={styles.errorBanner} role="alert">
                <span className={styles.errorIcon} aria-hidden="true">
                  <ReportIcon />
                </span>
                <div>
                  <strong>No se pudo completar la solicitud</strong>
                  <p>{errorMessage}</p>
                </div>
              </div>
            )}

            {notice && (
              <p className={styles.successNotice} role="status">
                {notice}
              </p>
            )}

            {step === "email" && (
              <form className={styles.form} onSubmit={handleSendCode}>
                <div className={styles.field}>
                  <label htmlFor="reset-email">Email</label>
                  <input
                    autoComplete="email"
                    id="reset-email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <button
                  className={styles.submitButton}
                  disabled={fetchStatus === "fetching"}
                  type="submit"
                >
                  {fetchStatus === "fetching" ? "Enviando..." : "Enviar código"}
                </button>
              </form>
            )}

            {step === "code" && (
              <form className={styles.form} onSubmit={handleVerifyCode}>
                <div className={styles.field}>
                  <label htmlFor="reset-code">Código de verificación</label>
                  <input
                    autoComplete="one-time-code"
                    id="reset-code"
                    inputMode="numeric"
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="Ingresá el código"
                    required
                    value={code}
                  />
                </div>
                <button
                  className={styles.submitButton}
                  disabled={fetchStatus === "fetching"}
                  type="submit"
                >
                  {fetchStatus === "fetching"
                    ? "Verificando..."
                    : "Verificar código"}
                </button>
                <button
                  className={styles.secondaryButton}
                  disabled={fetchStatus === "fetching"}
                  onClick={handleResendCode}
                  type="button"
                >
                  Reenviar código
                </button>
              </form>
            )}

            {step === "password" && (
              <form className={styles.form} onSubmit={handleSetPassword}>
                <div className={styles.field}>
                  <label htmlFor="new-password">Contraseña nueva</label>
                  <div className={styles.passwordInput}>
                    <input
                      autoComplete="new-password"
                      id="new-password"
                      minLength={8}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Mínimo 8 caracteres"
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
                <div className={styles.field}>
                  <label htmlFor="confirm-password">
                    Confirmar contraseña
                  </label>
                  <input
                    autoComplete="new-password"
                    id="confirm-password"
                    minLength={8}
                    onChange={(event) =>
                      setConfirmPassword(event.target.value)
                    }
                    placeholder="Repetí la contraseña nueva"
                    required
                    type="password"
                    value={confirmPassword}
                  />
                </div>
                <button
                  className={styles.submitButton}
                  disabled={fetchStatus === "fetching"}
                  type="submit"
                >
                  {fetchStatus === "fetching"
                    ? "Actualizando..."
                    : "Cambiar contraseña"}
                </button>
              </form>
            )}

            <Link className={styles.retryLink} href="/sign-in">
              Volver a iniciar sesión
            </Link>
          </div>
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

  async function handleResendCode() {
    setErrorMessage("");
    setNotice("");

    try {
      const { error } = await signIn.resetPasswordEmailCode.sendCode();

      if (error) {
        setErrorMessage(
          clerkErrorMessage(error, "No se pudo reenviar el código. Intentá de nuevo."),
        );
        return;
      }

      setNotice("Si el email corresponde a una cuenta, recibirás un código.");
    } catch {
      setErrorMessage("No se pudo reenviar el código. Intentá de nuevo.");
    }
  }
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
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

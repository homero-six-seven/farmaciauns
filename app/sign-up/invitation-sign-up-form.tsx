"use client";

import { useSignUp } from "@clerk/nextjs";
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
  const [error, setError] = useState("");
  const [accountCreated, setAccountCreated] = useState(false);
  const [linking, setLinking] = useState(false);

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
    setError("");

    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    try {
      const { error: ticketError } = await signUp.create({
        strategy: "ticket",
        ticket,
      });
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
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.content} aria-labelledby="invitation-title">
        <div className={styles.card}>
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
                className={styles.submitButton}
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
                  <input
                    autoComplete="new-password"
                    id="invitation-password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="invitation-confirmation">
                    Confirmar contraseña
                  </label>
                  <input
                    autoComplete="new-password"
                    id="invitation-confirmation"
                    minLength={8}
                    onChange={(event) => setConfirmation(event.target.value)}
                    required
                    type="password"
                    value={confirmation}
                  />
                </div>
                <button
                  className={styles.submitButton}
                  disabled={fetchStatus === "fetching"}
                  type="submit"
                >
                  {fetchStatus === "fetching" ? "Activando..." : "Activar cuenta"}
                </button>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

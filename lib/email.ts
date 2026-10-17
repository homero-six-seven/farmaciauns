/** Emails de la aplicación; los flujos heredados de restablecimiento y bienvenida siguen siendo stubs. */

import { clerkClient } from "@clerk/nextjs/server";

export async function sendPasswordResetEmail(email: string): Promise<void> {
  // STUB: sin proveedor de email. Solo se registra la intención en consola.
  console.log(
    `[STUB email] Enviar link de cambio de contraseña a: ${email}`,
  );
}

export async function sendNursePasswordChangeEmail(
  clerkUserId: string,
  emailFrom: string,
  passwordChangeUrl: string,
): Promise<void> {
  const clerk = await clerkClient();
  const escapedUrl = passwordChangeUrl.replace(/&/g, "&amp;");
  const email = await clerk.emails.create(
    {
      to: { userId: clerkUserId },
      from: { address: emailFrom, name: "Sala Médica" },
      subject: "Tu cuenta de enfermería está lista",
      text: `Tu cuenta de enfermería ya está activa. Iniciá sesión con la contraseña inicial que te informó el administrador. Para cambiarla, visitá ${passwordChangeUrl} y solicitá un código de recuperación.`,
      html: `<p>Tu cuenta de enfermería ya está activa.</p><p>Iniciá sesión con la contraseña inicial que te informó el administrador. Para cambiarla, <a href="${escapedUrl}">visitá la recuperación de contraseña</a> y solicitá un código.</p>`,
    },
    { idempotencyKey: `nurse_password_change_${clerkUserId}` },
  );

  if (email.status !== "accepted") {
    throw new Error(
      `Clerk did not accept the nurse password change email (status: ${email.status ?? "unknown"}).`,
    );
  }
}

/**
 * Email de bienvenida (US-04). Semántica distinta a `sendPasswordResetEmail`:
 * acá se da la bienvenida al nuevo médico con sus credenciales iniciales.
 */
export async function sendWelcomeEmail(
  email: string,
  nombre: string,
): Promise<void> {
  // STUB: sin proveedor de email. Solo se registra la intención en consola.
  console.log(
    `[STUB email] Enviar email de bienvenida a ${nombre} <${email}>`,
  );
}

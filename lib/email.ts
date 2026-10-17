/** Emails de la aplicación; los flujos heredados de restablecimiento y bienvenida siguen siendo stubs. */

export async function sendPasswordResetEmail(email: string): Promise<void> {
  // STUB: sin proveedor de email. Solo se registra la intención en consola.
  console.log(
    `[STUB email] Enviar link de cambio de contraseña a: ${email}`,
  );
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

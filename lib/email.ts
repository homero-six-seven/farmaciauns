/**
 * Envío de emails — STUB.
 *
 * `sendPasswordResetEmail` (US-07/US-08/US-11) solo hace `console.log` porque
 * no hay proveedor de email configurado. Cuando se integre un proveedor
 * (Resend, SendGrid, SMTP, etc.), reemplazar el cuerpo de esta función.
 *
 * Ver docs/CAMBIOS-US-GRUPO1.md → "Hardcodeos".
 */

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

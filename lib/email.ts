/** Emails de la aplicación; los flujos heredados de restablecimiento y bienvenida siguen siendo stubs. */

import nodemailer from "nodemailer";

interface AppointmentReminderEmail {
  email: string;
  nombre: string;
  fechaHora: Date;
  tipo: "CONSULTA" | "VACUNACION";
}

export async function sendAppointmentReminderEmail({
  email,
  nombre,
  fechaHora,
  tipo,
}: AppointmentReminderEmail): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const appPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");
  if (!user || !appPassword) {
    throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD must be set to send appointment reminders.");
  }

  const fechaFormateada = new Intl.DateTimeFormat("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(fechaHora);
  const descripcion = tipo === "CONSULTA" ? "consulta médica" : "vacunación";

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 10_000,
  });

  await transporter.sendMail({
    from: { name: "Farmacia UNS", address: user },
    to: email,
    subject: "Recordatorio de tu turno - Farmacia UNS",
    text: [
      `Hola ${nombre || "paciente"},`,
      "",
      `Te recordamos que tenés un turno de ${descripcion} el ${fechaFormateada}.`,
      "",
      "Te esperamos. Si necesitás gestionar tu turno, ingresá a Farmacia UNS.",
    ].join("\n"),
  });
}

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

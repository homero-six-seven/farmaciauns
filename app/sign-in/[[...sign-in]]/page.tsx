import { SignInForm } from "../sign-in-form";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ "sign-in"?: string[] }>;
  searchParams: Promise<{ reason?: string }>;
}) {
  const { "sign-in": segments } = await params;
  const { reason } = await searchParams;
  const errorMessages: Record<string, string> = {
    credentials:
      "El email o la contraseña son incorrectos. Revisá tus datos e intentá de nuevo.",
    service:
      "No se pudo completar el inicio de sesión. Intentá nuevamente en unos momentos.",
    finalize:
      "Tus credenciales se validaron, pero no se pudo iniciar la sesión. Volvé a intentarlo.",
    "compromised-password":
      "Por seguridad, Clerk bloqueó esta contraseña porque fue detectada en una filtración. Usá “¿Olvidaste tu contraseña?” para restablecerla.",
    "inactive-account":
      "Tu cuenta no está activa. Contactá a un administrador para solicitar acceso.",
  };

  return (
    <SignInForm
      initialError={segments?.[0] === "error"}
      initialErrorMessage={errorMessages[reason ?? ""] ?? undefined}
    />
  );
}

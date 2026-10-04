type ClerkActionError = {
  code: string;
  longMessage?: string;
  message: string;
};

const localizedErrors: Record<string, string> = {
  form_email_address_taken: "Ya existe una cuenta con ese email.",
  form_identifier_exists: "Ya existe una cuenta con ese email.",
  form_identifier_not_found:
    "No encontramos una cuenta con ese email. Revisá los datos e intentá de nuevo.",
  form_password_incorrect: "El email o la contraseña son incorrectos.",
  form_password_pwned:
    "Elegí una contraseña diferente; la actual no es segura.",
  form_password_too_short:
    "La contraseña es demasiado corta. Ingresá una más larga.",
  form_password_validation_failed:
    "La contraseña no cumple los requisitos de seguridad.",
  verification_code_invalid:
    "El código no es válido o venció. Revisalo e intentá de nuevo.",
};

export function clerkErrorMessage(
  error: ClerkActionError | null,
  fallback: string,
) {
  if (!error) {
    return fallback;
  }

  if (isCompromisedPasswordError(error)) {
    return "Por seguridad, Clerk no permite usar esta contraseña porque fue detectada en una filtración. Restablecela para continuar.";
  }

  return localizedErrors[error.code] ?? error.longMessage ?? fallback;
}

export function isCompromisedPasswordError(error: ClerkActionError | null) {
  return (
    error?.code === "api_response_error" &&
    /password has been found in an online data breach/i.test(error.message)
  );
}

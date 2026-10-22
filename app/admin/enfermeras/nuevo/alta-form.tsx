"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registrarEnfermera } from "@/app/actions";
import { FormInput } from "@/components/form-input";
import { ESTADO_INICIAL } from "@/lib/form-state";

/**
 * Formulario de alta de enfermera (US-15).
 * Client component: usa `useActionState` (React 19) con la server action
 * `registrarEnfermera`.
 */
export function AltaEnfermeraForm() {
  const [state, formAction, pending] = useActionState(
    registrarEnfermera,
    ESTADO_INICIAL,
  );
  const errores = state.errors;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {errores._form && (
        <div
          role="alert"
          className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
        >
          {errores._form}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <FormInput
          key={`firstName-${state.values?.firstName ?? ""}`}
          label="Nombre"
          name="firstName"
          required
          error={errores.firstName}
          hint="Máximo 50 caracteres"
          placeholder="Ej. Laura Beatriz"
          pattern="[\\p{L} '\\u2019]+"
          allowedCharacters={/[\p{L} '\u2019]/u}
          maxLength={50}
          autoComplete="given-name"
          defaultValue={state.values?.firstName}
        />
        <FormInput
          key={`lastName-${state.values?.lastName ?? ""}`}
          label="Apellido"
          name="lastName"
          required
          error={errores.lastName}
          hint="Máximo 50 caracteres"
          placeholder="Ej. Giménez"
          pattern="[\\p{L} '\\u2019]+"
          allowedCharacters={/[\p{L} '\u2019]/u}
          maxLength={50}
          autoComplete="family-name"
          defaultValue={state.values?.lastName}
        />
        <FormInput
          key={`dni-${state.values?.dni ?? ""}`}
          label="DNI"
          name="dni"
          required
          numeric
          error={errores.dni}
          hint="Solo números · 7 u 8 dígitos"
          placeholder="Ej. 31145780"
          pattern="[0-9]{7,8}"
          maxLength={8}
          allowedCharacters={/[0-9]/}
          defaultValue={state.values?.dni}
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          required
          error={errores.email}
          placeholder="nombre@salamedica.org.ar"
          autoComplete="email"
          defaultValue={state.values?.email}
        />
        <FormInput
          label="Teléfono"
          name="phone"
          type="tel"
          required
          numeric
          error={errores.phone}
          placeholder="+54 11 4801-2233"
          autoComplete="tel"
          defaultValue={state.values?.phone}
        />
      </div>

      <div className="flex justify-end gap-3 border-t border-surface-container-high pt-5">
        <Link
          href="/admin/enfermeras"
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Enviando invitación…" : "Registrar y enviar invitación"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { registrarPaciente } from "@/app/actions";
import { FormInput } from "@/components/form-input";
import { ESTADO_INICIAL } from "@/lib/form-state";

type CoberturaDisponible = { id: string; nombre: string };

/**
 * Formulario de autorregistro de paciente (US-06) con selección de cobertura
 * médica (US-21). Si elige una cobertura, el nº de afiliado es obligatorio; si
 * elige "Particular", no se requiere.
 */
export function RegistroPacienteForm({
  coberturas,
}: {
  coberturas: CoberturaDisponible[];
}) {
  const [state, formAction, pending] = useActionState(
    registrarPaciente,
    ESTADO_INICIAL,
  );
  const errores = state.errors;

  const [coberturaSeleccionada, setCoberturaSeleccionada] = useState("");

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
          label="Nombre"
          name="firstName"
          required
          error={errores.firstName}
          placeholder="Ej. Juan Carlos"
          autoComplete="given-name"
          defaultValue={state.values?.firstName}
        />
        <FormInput
          label="Apellido"
          name="lastName"
          required
          error={errores.lastName}
          placeholder="Ej. González"
          autoComplete="family-name"
          defaultValue={state.values?.lastName}
        />
        <FormInput
          label="DNI"
          name="dni"
          required
          numeric
          error={errores.dni}
          hint="Sin puntos · mínimo 7 dígitos"
          placeholder="Ej. 38450912"
          defaultValue={state.values?.dni}
        />
        <FormInput
          label="Fecha de nacimiento"
          name="birthDate"
          type="date"
          required
          error={errores.birthDate}
          autoComplete="bday"
          defaultValue={state.values?.birthDate}
        />
        <FormInput
          label="Email"
          name="email"
          type="email"
          required
          error={errores.email}
          placeholder="ejemplo@correo.com"
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
          placeholder="Ej. 11 4589 2200"
          autoComplete="tel"
          defaultValue={state.values?.phone}
        />

        {/* Cobertura médica (US-21) */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="coberturaId"
            className="flex items-center gap-1 text-sm font-medium text-on-surface"
          >
            <span>Cobertura médica</span>
          </label>
          <select
            id="coberturaId"
            name="coberturaId"
            defaultValue={state.values?.coberturaId ?? ""}
            onChange={(e) => setCoberturaSeleccionada(e.target.value)}
            aria-invalid={Boolean(errores.coberturaId)}
            className="h-10 w-full rounded border-0 bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="">Particular</option>
            {coberturas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
          {errores.coberturaId && (
            <span role="alert" className="text-xs font-medium text-error">
              {errores.coberturaId}
            </span>
          )}
        </div>

        {coberturaSeleccionada !== "" && (
          <FormInput
            label="Número de afiliado"
            name="numeroAfiliado"
            required
            error={errores.numeroAfiliado}
            placeholder="Ej. 123456"
            defaultValue={state.values?.numeroAfiliado}
          />
        )}

        <FormInput
          label="Contraseña"
          name="password"
          type="password"
          required
          error={errores.password}
          hint="Mínimo 8 caracteres"
          autoComplete="new-password"
        />
        <FormInput
          label="Confirmar contraseña"
          name="confirmPassword"
          type="password"
          required
          error={errores.confirmPassword}
          hint="Debe coincidir con la contraseña"
          autoComplete="new-password"
        />
      </div>

      <div className="flex justify-end border-t border-surface-container-high pt-5">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 min-w-[220px] items-center justify-center gap-2 rounded bg-primary px-6 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Registrando…" : "Registrarme"}
        </button>
      </div>
    </form>
  );
}

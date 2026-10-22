"use client";

import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { useActionState } from "react";
import { actualizarMedico } from "./actions";

type DoctorFormValues = {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  matricula: string;
  especialidad: string;
  email: string;
  phone: string;
};

export function EditarMedicoForm({
  doctor,
  especialidades,
}: {
  doctor: DoctorFormValues;
  especialidades: readonly string[];
}) {
  const [state, formAction, pending] = useActionState(actualizarMedico, {
    errors: {},
    values: {},
  });
  const values = state.values;

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="id" value={doctor.id} />
      {state.errors._form && (
        <p
          className="rounded-lg bg-error-container px-4 py-3 text-sm font-medium text-on-error-container"
          role="alert"
        >
          {state.errors._form}
        </p>
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Field
          label="Nombre"
          name="firstName"
          required
          error={state.errors.firstName}
          defaultValue={values?.firstName ?? doctor.firstName}
          autoComplete="given-name"
          pattern="\p{L}+(?:[ '\u2019-]\p{L}+)*"
        />
        <Field
          label="Apellido"
          name="lastName"
          required
          error={state.errors.lastName}
          defaultValue={values?.lastName ?? doctor.lastName}
          autoComplete="family-name"
          pattern="\p{L}+(?:[ '\u2019-]\p{L}+)*"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="dni" className="text-sm font-medium text-on-surface">
            DNI
            <LockKeyhole
              aria-label="No editable"
              className="ml-2 inline h-3.5 w-3.5 text-on-surface-variant"
            />
          </label>
          <input
            id="dni"
            value={doctor.dni}
            disabled
            className="h-10 w-full rounded bg-surface-container-high px-3 text-sm text-on-surface-variant disabled:cursor-not-allowed"
          />
          <span className="text-xs italic text-on-surface-variant">
            El DNI no se puede modificar
          </span>
        </div>

        <Field
          label="Matrícula"
          name="matricula"
          required
          error={state.errors.matricula}
          defaultValue={values?.matricula ?? doctor.matricula}
          pattern="MN [0-9]{6}"
          maxLength={9}
          placeholder="MN 123456"
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="especialidad" className="text-sm font-medium text-on-surface">
            Especialidad <span className="text-error" aria-hidden="true">*</span>
          </label>
          <select
            id="especialidad"
            name="especialidad"
            required
            defaultValue={values?.especialidad ?? doctor.especialidad}
            aria-invalid={Boolean(state.errors.especialidad)}
            className="h-10 w-full rounded border-0 bg-surface-container-low px-3 text-sm text-on-surface focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="" disabled>
              Seleccioná una especialidad
            </option>
            {especialidades.map((especialidad) => (
              <option key={especialidad} value={especialidad}>
                {especialidad}
              </option>
            ))}
          </select>
          {state.errors.especialidad && (
            <span role="alert" className="text-xs font-medium text-error">
              {state.errors.especialidad}
            </span>
          )}
        </div>

        <Field
          label="Email institucional"
          name="email"
          type="email"
          required
          error={state.errors.email}
          defaultValue={values?.email ?? doctor.email}
          autoComplete="email"
        />
        <Field
          label="Teléfono de contacto"
          name="phone"
          type="tel"
          required
          error={state.errors.phone}
          defaultValue={values?.phone ?? doctor.phone}
          autoComplete="tel"
          pattern="[0-9+ ()-]+"
        />
      </div>

      <div className="flex flex-col-reverse justify-end gap-3 border-t border-surface-container-high pt-5 sm:flex-row">
        <Link
          href="/admin/medicos"
          className="inline-flex h-10 items-center justify-center rounded bg-surface-container-high px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  error,
  defaultValue,
  autoComplete,
  pattern,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  type?: "text" | "email" | "tel";
  required?: boolean;
  error?: string;
  defaultValue: string;
  autoComplete?: "given-name" | "family-name" | "email" | "tel";
  pattern?: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-sm font-medium text-on-surface">
        {label}
        {required && <span className="ml-1 text-error" aria-hidden="true">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        pattern={pattern}
        maxLength={maxLength}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className={`h-10 w-full rounded border-0 px-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 ${
          error
            ? "bg-error-container/30 focus:ring-error/40"
            : "bg-surface-container-low focus:bg-surface-container-lowest focus:ring-primary/40"
        }`}
      />
      {error && (
        <span role="alert" className="text-xs font-medium text-error">
          {error}
        </span>
      )}
    </div>
  );
}

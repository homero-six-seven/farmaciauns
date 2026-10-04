"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { createMedicoAction, type CreateMedicoState } from "./actions";

const initialState: CreateMedicoState = {
  success: false,
};

export function AltaMedicoForm() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(createMedicoAction, initialState);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (state.success && state.doctorId) {
      router.push(`/admin/medicos/${state.doctorId}/confirmacion`);
    }
  }, [state, router]);

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Header Block */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
        <div>
          <div className="flex items-center gap-space-xs mb-1">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Módulo Clínico
            </span>
            <span className="text-secondary font-label-sm text-label-sm">/</span>
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider">
              Cuerpo Médico
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Alta de médico
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Ingresá los datos del profesional para registrarlo en el sistema.
          </p>
        </div>

        {/* Protocol Metadata Badge */}
        <div className="flex items-center gap-space-sm bg-surface-container-low px-space-md py-space-sm rounded-lg shadow-sm border border-outline-variant/30">
          <span className="material-symbols-outlined text-[18px] text-secondary">
            verified_user
          </span>
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
              Validación RENAPER &amp; SISA
            </span>
            <span className="font-label-md text-label-md text-on-surface font-medium">
              Formulario Clínico Oficial
            </span>
          </div>
        </div>
      </div>

      {state.errors?.general && (
        <div className="p-space-md bg-error-container/40 border border-error text-error rounded-lg flex items-center gap-space-sm font-label-md">
          <span className="material-symbols-outlined text-[20px]">error</span>
          <span>{state.errors.general}</span>
        </div>
      )}

      {/* Main Clinical Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column: Form Card */}
        <div className="lg:col-span-8 flex flex-col gap-space-lg">
          <form
            action={formAction}
            className="bg-surface-container-lowest rounded-xl shadow-md p-space-xl flex flex-col gap-space-lg border border-outline-variant/20"
          >
            {/* Card Header Indicator */}
            <div className="flex items-center justify-between pb-space-sm border-b border-surface-container-low">
              <div className="flex items-center gap-space-sm">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Datos Personales y Profesionales
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-secondary">
                Campos obligatorios marcados con asterisco (*)
              </span>
            </div>

            {/* Two-column inputs grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-space-lg">
              {/* Columna Izquierda */}
              <div className="flex flex-col gap-space-lg">
                {/* 1. Campo Nombre */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="nombre"
                    className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                  >
                    <span>
                      Nombre <span className="text-error font-bold">*</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Primer y segundo nombre
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="nombre"
                      name="nombre"
                      type="text"
                      placeholder="Ej. Lucas Alejandro"
                      defaultValue=""
                      className={`w-full h-10 px-3 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.nombre
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                  </div>
                  {state.errors?.nombre && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.nombre}
                      </p>
                    </div>
                  )}
                </div>

                {/* 2. Campo DNI */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="dni"
                    className={`font-label-md text-label-md flex items-center justify-between ${
                      state.errors?.dni ? "text-error font-semibold" : "text-on-surface"
                    }`}
                  >
                    <span>
                      DNI <span className="text-error font-bold">*</span>
                    </span>
                    <span
                      className={`font-label-sm text-label-sm ${
                        state.errors?.dni ? "text-error uppercase font-bold" : "text-secondary"
                      }`}
                    >
                      {state.errors?.dni?.includes("ya está registrado")
                        ? "Duplicado"
                        : "Solo números"}
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="dni"
                      name="dni"
                      type="text"
                      placeholder="Ej. 34892110"
                      className={`w-full h-10 px-3 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.dni
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error pr-10"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                    {state.errors?.dni && (
                      <span className="material-symbols-outlined text-[20px] text-error absolute right-3 pointer-events-none">
                        warning
                      </span>
                    )}
                  </div>
                  {state.errors?.dni && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.dni}
                      </p>
                    </div>
                  )}
                </div>

                {/* 3. Campo Especialidad */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="especialidad"
                    className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                  >
                    <span>
                      Especialidad <span className="text-error font-bold">*</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Asignación primaria
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      id="especialidad"
                      name="especialidad"
                      defaultValue=""
                      className={`w-full h-10 px-3 pr-9 font-body-md text-body-md rounded-lg focus:outline-none appearance-none cursor-pointer transition-all border ${
                        state.errors?.especialidad
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    >
                      <option disabled value="">
                        Seleccione una especialidad
                      </option>
                      <option value="Clínica médica">Clínica médica</option>
                      <option value="Pediatría">Pediatría</option>
                      <option value="Traumatología">Traumatología</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-2.5 top-2.5 text-[20px] text-secondary pointer-events-none">
                      expand_more
                    </span>
                  </div>
                  {state.errors?.especialidad && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.especialidad}
                      </p>
                    </div>
                  )}
                </div>

                {/* 4. Campo Email */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="email"
                    className={`font-label-md text-label-md flex items-center justify-between ${
                      state.errors?.email ? "text-error font-semibold" : "text-on-surface"
                    }`}
                  >
                    <span>
                      Email <span className="text-error font-bold">*</span>
                    </span>
                    <span
                      className={`font-label-sm text-label-sm ${
                        state.errors?.email ? "text-error uppercase font-bold" : "text-secondary"
                      }`}
                    >
                      {state.errors?.email?.includes("ya está registrado")
                        ? "Conflicto"
                        : "Institucional / Directo"}
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="doctor@salamedica.org.ar"
                      className={`w-full h-10 px-3 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.email
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error pr-10"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                    {state.errors?.email && (
                      <span className="material-symbols-outlined text-[20px] text-error absolute right-3 pointer-events-none">
                        alternate_email
                      </span>
                    )}
                  </div>
                  {state.errors?.email && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.email}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="flex flex-col gap-space-lg">
                {/* 5. Campo Apellido */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="apellido"
                    className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                  >
                    <span>
                      Apellido <span className="text-error font-bold">*</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Apellido completo
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="apellido"
                      name="apellido"
                      type="text"
                      placeholder="Ej. Rossi"
                      className={`w-full h-10 px-3 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.apellido
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                  </div>
                  {state.errors?.apellido && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.apellido}
                      </p>
                    </div>
                  )}
                </div>

                {/* 6. Campo Matrícula */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="matricula"
                    className={`font-label-md text-label-md flex items-center justify-between ${
                      state.errors?.matricula ? "text-error font-semibold" : "text-on-surface"
                    }`}
                  >
                    <span>
                      Matrícula <span className="text-error font-bold">*</span>
                    </span>
                    <span
                      className={`font-label-sm text-label-sm ${
                        state.errors?.matricula ? "text-error uppercase font-bold" : "text-secondary"
                      }`}
                    >
                      N° Nacional o Provincial
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="matricula"
                      name="matricula"
                      type="text"
                      placeholder="Ej. MN 149832"
                      className={`w-full h-10 px-3 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.matricula
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error pr-10"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                    {state.errors?.matricula && (
                      <span className="material-symbols-outlined text-[20px] text-error absolute right-3 pointer-events-none">
                        priority_high
                      </span>
                    )}
                  </div>
                  {state.errors?.matricula && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.matricula}
                      </p>
                    </div>
                  )}
                </div>

                {/* 7. Campo Teléfono */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="telefono"
                    className="font-label-md text-label-md text-on-surface flex items-center justify-between"
                  >
                    <span>
                      Teléfono <span className="text-error font-bold">*</span>
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary">
                      Urgencias / Guardia
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      id="telefono"
                      name="telefono"
                      type="tel"
                      placeholder="+54 11 4980-2210"
                      className={`w-full h-10 px-3 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.telefono
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                  </div>
                  {state.errors?.telefono && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.telefono}
                      </p>
                    </div>
                  )}
                </div>

                {/* 8. Campo Contraseña inicial */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="password"
                    className={`font-label-md text-label-md flex items-center justify-between ${
                      state.errors?.password ? "text-error font-semibold" : "text-on-surface"
                    }`}
                  >
                    <span>
                      Contraseña inicial <span className="text-error font-bold">*</span>
                    </span>
                    <span
                      className={`font-label-sm text-label-sm ${
                        state.errors?.password ? "text-error font-bold" : "text-secondary"
                      }`}
                    >
                      Provisoria
                    </span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••••••"
                      className={`w-full h-10 pl-3 pr-10 font-body-md text-body-md rounded-lg focus:outline-none transition-all border ${
                        state.errors?.password
                          ? "bg-error-container/30 border-error focus:ring-1 focus:ring-error"
                          : "bg-surface-container-low border-outline-variant/30 text-on-surface focus:bg-surface-container-lowest focus:ring-2 focus:ring-primary"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Ver u ocultar contraseña"
                      className="absolute right-2.5 text-secondary hover:text-on-surface p-1 rounded transition-colors focus:outline-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[20px] align-middle">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  <span className="font-body-sm text-body-sm text-secondary">
                    Mínimo 8 caracteres
                  </span>
                  {state.errors?.password && (
                    <div className="flex items-center gap-1.5 text-error mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">arrow_right</span>
                      <p className="font-label-sm text-label-sm text-error font-medium">
                        {state.errors.password}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Action Toolbar */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-space-sm pt-space-md mt-space-sm border-t border-surface-container-low">
              <Link
                href="/admin/medicos"
                className="w-full sm:w-auto h-10 px-space-lg rounded-lg bg-surface-container-low text-on-surface font-label-md text-label-md hover:bg-surface-container transition-all flex items-center justify-center gap-space-xs text-center"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
                <span>Cancelar</span>
              </Link>
              <button
                type="submit"
                disabled={isPending}
                className="w-full sm:w-auto h-10 px-space-xl rounded-lg bg-primary text-on-primary font-label-md text-label-md hover:bg-primary-container shadow-md transition-all flex items-center justify-center gap-space-xs disabled:opacity-50 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">badge</span>
                <span>{isPending ? "Registrando..." : "Confirmar alta"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Institutional Context & Requirements Sidepanel */}
        <div className="lg:col-span-4 flex flex-col gap-space-md">
          <div className="bg-surface-container-lowest rounded-xl shadow-md p-space-lg flex flex-col gap-space-md border border-outline-variant/20">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-on-surface">
                <span className="material-symbols-outlined text-[20px]">
                  assignment_turned_in
                </span>
              </div>
              <div>
                <span className="font-headline-sm text-headline-sm text-on-surface block font-bold">
                  Requisitos de alta
                </span>
                <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">
                  Protocolo de ingreso
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-space-sm pt-space-xs">
              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                  lock_reset
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Primer inicio de sesión
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    El profesional recibirá un email para definir una nueva contraseña de acceso.
                  </span>
                </div>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                  fact_check
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Validación de Matrícula
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    La matrícula ingresada queda vinculada al libro de actas digitales y recetarios.
                  </span>
                </div>
              </div>

              <div className="p-space-sm rounded-lg bg-surface-container-low flex items-start gap-space-sm">
                <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5">
                  verified
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">
                    Unicidad de DNI y Email
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    El sistema rechaza automáticamente altas duplicadas por DNI o cuenta de correo.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

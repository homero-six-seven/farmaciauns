"use client";

import { useState } from "react";

export interface EnfermeraItem {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dni: string | null;
  email: string;
  phone: string | null;
  isActive: boolean;
}

interface EnfermerasClientProps {
  enfermeras: EnfermeraItem[];
}

function formatDni(dni: string | null | undefined): string {
  if (!dni) return "S/D";
  const clean = dni.replace(/\D/g, "");
  if (clean.length === 8) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  }
  if (clean.length === 7) {
    return `${clean.slice(0, 1)}.${clean.slice(1, 4)}.${clean.slice(4)}`;
  }
  return dni;
}

export function EnfermerasClient({ enfermeras }: EnfermerasClientProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    enfermeras[0]?.id ?? null
  );

  const selectedEnfermera =
    enfermeras.find((e) => e.id === selectedId) || enfermeras[0] || null;

  return (
    <div className="flex flex-col gap-space-lg w-full">
      {/* Breadcrumb & Workflow Metadata */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-sm mb-space-md">
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-space-xs font-mono text-label-sm font-label-sm text-on-surface-variant tracking-wider uppercase"
        >
          <span>MÓDULO CLÍNICO</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span>EQUIPO DE ENFERMERÍA</span>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-on-surface font-semibold">LISTADO DE ENFERMERAS</span>
        </nav>
        <div className="flex items-center gap-space-sm font-mono text-label-sm font-label-sm text-on-surface-variant">
          <span className="inline-flex items-center gap-1.5 px-space-xs py-0.5 rounded-lg bg-surface-container-high">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            SINCRONIZADO
          </span>
          <span>NODO-ENF-04</span>
        </div>
      </div>

      {/* Header Section */}
      <header className="flex flex-col gap-space-xs mb-space-lg">
        <div className="flex items-center gap-space-sm">
          <div className="w-2.5 h-6 bg-primary rounded-xs"></div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Listado de enfermeras
          </h1>
        </div>
        <p className="font-body-md text-body-md text-on-surface-variant max-w-4xl">
          Padrón maestro de personal de enfermería y cuidados clínicos asistenciales. Registro
          administrativo exclusivo de consulta institucional para control de dotación, licencias y
          turnos operativos.
        </p>
      </header>

      {/* Empty State vs Content */}
      {enfermeras.length === 0 ? (
        <div className="w-full bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-space-md">
            <span className="material-symbols-outlined text-[32px]">folder_off</span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface font-semibold mb-space-xs">
            No hay enfermeras registradas
          </h3>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mb-space-md">
            No se encontraron registros de personal de enfermería en el padrón del centro de salud.
          </p>
          <div className="p-space-sm px-space-md rounded-lg bg-surface-container-low max-w-xl text-left flex items-start gap-space-sm">
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant shrink-0 mt-0.5">
              lock_clock
            </span>
            <p className="font-body-sm text-body-sm text-on-surface-variant font-mono">
              <strong className="font-semibold text-on-surface">AVISO DEL SISTEMA:</strong> La
              función de alta y carga masiva para este perfil se encuentra programada para el siguiente
              ciclo de despliegue institucional. Comuníquese con la Dirección Médica para
              importaciones directas de padrón.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-space-lg mb-space-xl">
          {/* Left Column: Master Table (7 Cols) */}
          <div className="xl:col-span-7 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm">
            {/* Table Header Bar */}
            <div className="p-space-md flex flex-wrap items-center justify-between gap-space-sm bg-surface-container-low rounded-t-xl">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-[20px] text-on-surface">
                  medical_services
                </span>
                <span className="font-label-lg text-label-lg text-on-surface tracking-tight uppercase font-semibold">
                  Nómina de enfermería
                </span>
                <span className="font-mono text-label-sm font-label-sm px-space-xs py-0.5 rounded bg-surface-container-highest text-on-surface font-semibold">
                  {enfermeras.length} REGISTROS
                </span>
              </div>
              <div className="flex items-center gap-space-xs font-mono text-label-sm font-label-sm text-on-surface-variant">
                <span className="material-symbols-outlined text-[16px]">swap_vert</span>
                <span>ORDENADO: APELLIDO (ASC)</span>
              </div>
            </div>

            {/* Table Container */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left font-body-sm text-body-sm text-on-surface">
                <thead>
                  <tr className="bg-surface-container-high text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider font-mono">
                    <th className="py-space-sm px-space-md w-10 text-center" scope="col">
                      SEL
                    </th>
                    <th className="py-space-sm px-space-md" scope="col">
                      Apellido y nombre
                    </th>
                    <th className="py-space-sm px-space-md font-mono" scope="col">
                      DNI
                    </th>
                    <th className="py-space-sm px-space-md" scope="col">
                      Email
                    </th>
                    <th className="py-space-sm px-space-md text-right" scope="col">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-transparent font-mono">
                  {enfermeras.map((enf) => {
                    const isSelected = selectedEnfermera?.id === enf.id;

                    return (
                      <tr
                        key={enf.id}
                        onClick={() => setSelectedId(enf.id)}
                        className={`transition-colors cursor-pointer border-b border-surface-container-low ${
                          isSelected
                            ? "bg-primary text-on-primary shadow-sm font-medium"
                            : "hover:bg-surface-container-low group"
                        }`}
                      >
                        <td className="py-space-sm px-space-md text-center">
                          {isSelected ? (
                            <div className="w-4 h-4 rounded-full bg-on-primary flex items-center justify-center mx-auto">
                              <div className="w-2 h-2 rounded-full bg-primary"></div>
                            </div>
                          ) : (
                            <div className="w-4 h-4 rounded-full bg-surface-container-highest mx-auto flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-surface-container-lowest"></div>
                            </div>
                          )}
                        </td>
                        <td
                          className={`py-space-sm px-space-md font-body-sm text-body-sm ${
                            isSelected
                              ? "font-bold text-on-primary"
                              : "font-semibold text-on-surface"
                          }`}
                        >
                          <div className="flex items-center gap-space-xs">
                            <span>
                              {enf.lastName}, {enf.firstName}
                            </span>
                            {isSelected && (
                              <span className="material-symbols-outlined text-[16px] text-on-primary">
                                arrow_forward
                              </span>
                            )}
                          </div>
                        </td>
                        <td
                          className={`py-space-sm px-space-md font-mono ${
                            isSelected ? "text-on-primary/90" : "text-on-surface-variant"
                          }`}
                        >
                          {formatDni(enf.dni)}
                        </td>
                        <td
                          className={`py-space-sm px-space-md font-mono ${
                            isSelected ? "text-on-primary/90" : "text-on-surface-variant"
                          }`}
                        >
                          {enf.email}
                        </td>
                        <td className="py-space-sm px-space-md text-right">
                          <span
                            className={`inline-flex items-center px-space-xs py-0.5 rounded text-label-sm font-label-sm font-mono font-semibold ${
                              isSelected
                                ? "bg-surface-container-lowest text-primary font-bold tracking-wide"
                                : enf.isActive
                                ? "bg-surface-container-high text-on-surface"
                                : "bg-surface-container-highest text-on-surface-variant line-through"
                            }`}
                          >
                            {enf.isActive ? "ACTIVO" : "INACTIVO"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination / Status Bar */}
            <div className="mt-auto p-space-md bg-surface-container-low rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-space-xs font-mono text-label-sm font-label-sm text-on-surface-variant">
              <div className="flex items-center gap-space-xs">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span>
                  Mostrando 1-{enfermeras.length} de {enfermeras.length} registros • Pág. 1 de 1
                </span>
              </div>
              <div className="flex items-center gap-space-xs">
                <button
                  type="button"
                  disabled
                  className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed uppercase font-mono text-label-sm"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled
                  className="px-space-sm py-1 rounded bg-surface-container-high text-on-surface-variant/40 cursor-not-allowed uppercase font-mono text-label-sm"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Detail Panel (Ficha técnica de sólo lectura) (5 Cols) */}
          {selectedEnfermera && (
            <div className="xl:col-span-5 flex flex-col bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
              {/* Detail Header */}
              <div className="p-space-md bg-surface-container-low flex items-center justify-between gap-space-sm">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-[20px] text-on-surface">
                    clinical_notes
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                    Detalle de la profesional
                  </span>
                </div>
                <span
                  className={`px-space-sm py-0.5 rounded font-mono text-label-sm font-label-sm font-bold tracking-wider ${
                    selectedEnfermera.isActive
                      ? "bg-primary text-on-primary"
                      : "bg-surface-container-highest text-secondary"
                  }`}
                >
                  {selectedEnfermera.isActive ? "ACTIVO" : "INACTIVO"}
                </span>
              </div>

              {/* Technical Profile Banner */}
              <div className="p-space-lg bg-surface-container-lowest">
                <div className="flex items-center gap-space-md">
                  <div className="w-16 h-16 rounded-xl bg-primary text-on-primary flex items-center justify-center font-headline-lg text-headline-lg font-bold shadow-sm">
                    {(selectedEnfermera.firstName?.[0] || "") +
                      (selectedEnfermera.lastName?.[0] || "")}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-space-xs">
                      <span className="font-mono text-label-sm font-label-sm text-on-surface-variant uppercase tracking-wider">
                        ID #ENF-{selectedEnfermera.dni?.slice(-4) || "0000"}
                      </span>
                    </div>
                    <h2 className="font-headline-md text-headline-md text-on-surface font-bold truncate">
                      {selectedEnfermera.firstName} {selectedEnfermera.lastName}
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      Enfermera profesional / Cuidados generales
                    </p>
                  </div>
                </div>
              </div>

              {/* Key-Value Fields Grid */}
              <div className="px-space-lg py-space-md grid grid-cols-1 sm:grid-cols-2 gap-space-md bg-surface-container-low/50">
                <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Nombre
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">
                    {selectedEnfermera.firstName || "—"}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Apellido
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold">
                    {selectedEnfermera.lastName || "—"}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    DNI
                  </span>
                  <span className="font-mono font-body-md text-body-md text-on-surface font-semibold">
                    {formatDni(selectedEnfermera.dni)}
                  </span>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Estado laboral
                  </span>
                  <span className="font-body-md text-body-md text-on-surface font-semibold flex items-center gap-1">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        selectedEnfermera.isActive ? "bg-primary" : "bg-secondary"
                      }`}
                    ></span>
                    {selectedEnfermera.isActive ? "Activo regular" : "Licencia / Inactivo"}
                  </span>
                </div>
                <div className="sm:col-span-2 p-space-sm rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Correo electrónico corporativo
                  </span>
                  <span className="font-mono font-body-md text-body-md text-on-surface font-semibold">
                    {selectedEnfermera.email}
                  </span>
                </div>
                <div className="sm:col-span-2 p-space-sm rounded-lg bg-surface-container-lowest">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider block mb-0.5">
                    Teléfono directo de contacto
                  </span>
                  <span className="font-mono font-body-md text-body-md text-on-surface font-semibold">
                    {selectedEnfermera.phone || "+54 11 4980-0000"}
                  </span>
                </div>
              </div>

              {/* Operative Assignment Block */}
              <div className="p-space-lg flex flex-col gap-space-sm bg-surface-container-lowest mt-auto">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm font-mono text-on-surface-variant uppercase tracking-wider font-semibold">
                    Sector de asignación en servicio
                  </span>
                  <span className="font-mono text-label-sm font-label-sm px-space-xs py-0.5 rounded bg-surface-container-high text-on-surface font-semibold">
                    MOD-C
                  </span>
                </div>
                <div className="p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-md">
                  <span className="material-symbols-outlined text-[24px] text-primary">domain</span>
                  <div className="flex flex-col">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Sala de observación / Triage de guardia
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">
                      Turno rotativo asistencial
                    </span>
                    <div className="mt-space-xs flex items-center gap-space-sm font-mono text-label-sm font-label-sm text-on-surface">
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-highest">
                        Camas 01-12
                      </span>
                      <span className="px-space-xs py-0.5 rounded bg-surface-container-highest">
                        Supervisión en piso
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-space-sm rounded-lg bg-surface-container-high/60 flex items-center justify-between text-on-surface-variant font-mono text-label-sm font-label-sm">
                  <span>Registro institucional:</span>
                  <span>SOLO LECTURA</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

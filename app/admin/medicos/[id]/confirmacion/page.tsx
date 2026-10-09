import Link from "next/link";
import { notFound } from "next/navigation";
import { getPrisma } from "../../../../../lib/prisma";

export const dynamic = "force-dynamic";

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

function especialidadLabel(esp: string | null | undefined): string {
  switch (esp) {
    case "CLINICA_MEDICA":
      return "Clínica médica";
    case "PEDIATRIA":
      return "Pediatría";
    case "TRAUMATOLOGIA":
      return "Traumatología";
    default:
      return "Clínica médica";
  }
}

export default async function ConfirmacionAltaMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const prisma = getPrisma();

  const doctor = await prisma.user.findUnique({
    where: { id },
  });

  if (!doctor || doctor.role !== "MEDICO") {
    notFound();
  }

  const trackingId = `REG-MED-2026-${doctor.dni?.slice(-4) || "0841"}`;

  return (
    <div className="p-space-lg md:p-space-xl max-w-6xl mx-auto w-full flex flex-col gap-space-lg">
      {/* Migas de pan / Contexto superior */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider"
      >
        <span className="hover:text-on-surface transition-colors">Módulo Clínico</span>
        <span className="material-symbols-outlined text-[14px] text-secondary">chevron_right</span>
        <Link href="/admin/medicos/nuevo" className="hover:text-on-surface transition-colors">
          Alta de Médico
        </Link>
        <span className="material-symbols-outlined text-[14px] text-secondary">chevron_right</span>
        <span className="text-primary font-label-sm text-label-sm px-1.5 py-0.5 rounded bg-surface-container-high font-semibold">
          Confirmación
        </span>
      </nav>

      {/* Indicador de flujo de trabajo */}
      <div className="flex items-center justify-between pb-space-sm">
        <div className="flex flex-col">
          <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">
            Protocolo de Incorporación
          </span>
          <h1 className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-bold">
            Expediente Médico Generado
          </h1>
        </div>
        <div className="hidden sm:flex items-center gap-space-xs bg-surface-container px-space-sm py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          <span className="font-label-sm text-label-sm text-on-surface font-mono font-semibold">
            {trackingId}
          </span>
        </div>
      </div>

      {/* Tarjeta Principal de Confirmación */}
      <div className="w-full max-w-3xl mx-auto bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden flex flex-col">
        {/* Encabezado con estado de éxito */}
        <div className="p-space-xl bg-surface-container-low flex flex-col items-center text-center border-b border-surface-container">
          <div className="w-14 h-14 rounded-full bg-surface-container-lowest shadow-sm flex items-center justify-center mb-space-md">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-on-primary text-[24px]">check</span>
            </div>
          </div>
          <h2 className="font-headline-md text-headline-md text-on-surface tracking-tight mb-1 font-bold">
            Médico registrado correctamente
          </h2>
          <p className="font-body-md text-body-md text-secondary max-w-xl">
            El profesional ha sido incorporado al sistema asistencial y habilitado para asignación
            de turnos.
          </p>
        </div>

        {/* Cuerpo: Resumen del médico y ficha técnica */}
        <div className="p-space-xl flex flex-col gap-space-lg">
          {/* Título de sección de la ficha */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-space-xs">
              <span className="material-symbols-outlined text-secondary text-[18px]">badge</span>
              <span className="font-label-md text-label-md uppercase tracking-wider text-secondary font-bold">
                Ficha Técnica Institucional
              </span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-mono">
              ID SIS: #MD-{doctor.dni || "00000000"}
            </span>
          </div>

          {/* Grid de dos columnas (Pares Clave-Valor) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md bg-surface-container-low/50 p-space-lg rounded-lg border border-outline-variant/20">
            {/* Columna 1 */}
            <div className="flex flex-col gap-space-md">
              {/* Nombre y Apellido */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Nombre y Apellido
                </span>
                <span className="font-headline-sm text-headline-sm text-on-surface mt-0.5 font-bold">
                  Dr. {doctor.firstName} {doctor.lastName}
                </span>
              </div>

              {/* DNI */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  DNI
                </span>
                <span className="font-body-lg text-body-lg text-on-surface font-mono mt-0.5 font-medium">
                  {formatDni(doctor.dni)}
                </span>
              </div>

              {/* Matrícula */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Matrícula Nacional
                </span>
                <div className="flex items-center gap-space-xs mt-0.5">
                  <span className="font-body-lg text-body-lg text-on-surface font-mono font-semibold">
                    {doctor.matricula}
                  </span>
                  <span className="material-symbols-outlined text-secondary text-[16px]">
                    verified
                  </span>
                </div>
              </div>

              {/* Especialidad */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Especialidad Asignada
                </span>
                <span className="font-body-lg text-body-lg text-on-surface mt-0.5 font-medium">
                  {especialidadLabel(doctor.especialidad)}
                </span>
              </div>
            </div>

            {/* Columna 2 */}
            <div className="flex flex-col gap-space-md">
              {/* Email */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Correo Institucional
                </span>
                <span className="font-body-lg text-body-lg text-on-surface font-mono mt-0.5 break-all font-medium">
                  {doctor.email}
                </span>
              </div>

              {/* Teléfono */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Teléfono de Contacto
                </span>
                <span className="font-body-lg text-body-lg text-on-surface font-mono mt-0.5 font-medium">
                  {doctor.phone}
                </span>
              </div>

              {/* Rol Clínico */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Rol de Sistema
                </span>
                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                    <span className="material-symbols-outlined text-[14px]">stethoscope</span>
                    Médico Titular
                  </span>
                </div>
              </div>

              {/* Estado de Operatividad */}
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                  Estado Operativo
                </span>
                <div className="mt-1 flex items-center">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-surface-bright animate-ping"></span>
                    Activo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Banner de Notificación Institucional y Credenciales */}
          <div className="bg-surface-container rounded-lg p-space-md flex items-start gap-space-md border border-outline-variant/20">
            <div className="w-9 h-9 rounded bg-surface-container-lowest flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <span className="material-symbols-outlined text-primary text-[20px]">
                mark_email_read
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="font-label-md text-label-md text-on-surface font-semibold">
                Aviso de emisión de credenciales seguras
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Se envió una invitación de Clerk a{" "}
                <strong className="text-on-surface font-mono font-medium">{doctor.email}</strong>{" "}
                para que defina su contraseña y active su cuenta.
              </p>
              <p className="font-label-sm text-label-sm text-secondary mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">schedule</span>
                La invitación vence según la vigencia configurada en Clerk.
              </p>
            </div>
          </div>

          {/* Barra de Acciones y Navegación Rápida (CA3) */}
          <div className="pt-space-sm flex flex-col-reverse sm:flex-row items-center justify-end gap-space-md border-t border-surface-container-low">
            <Link
              href="/admin/medicos/nuevo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors text-center font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              <span>Registrar otro médico</span>
            </Link>
            <Link
              href="/admin/medicos"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-space-xs px-space-lg py-2.5 rounded bg-primary text-on-primary hover:bg-primary-container transition-colors font-label-md text-label-md text-center shadow-sm font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">clinical_notes</span>
              <span>Ir al listado de médicos</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Metadatos de Auditoría y Trazabilidad */}
      <div className="w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between text-secondary font-label-sm text-label-sm px-space-sm">
        <div className="flex items-center gap-space-xs">
          <span className="material-symbols-outlined text-[14px]">lock</span>
          <span>Acreditación criptográfica completada. Sin claves almacenadas en texto plano.</span>
        </div>
        <div className="font-mono text-[11px] mt-1 sm:mt-0">
          TRANSACCIÓN ID: {doctor.id.slice(-8).toUpperCase()}
        </div>
      </div>
    </div>
  );
}

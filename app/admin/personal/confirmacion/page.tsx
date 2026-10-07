import Link from "next/link";
import { etiquetaRol } from "@/lib/domain/usuario";
import { getUserRepository } from "@/lib/repository";
import { requireRole } from "@/lib/authorization";

/**
 * US-08 (RF-16) — Confirmación de alta de personal administrativo.
 * Muestra el resumen del usuario recién creado SIN exponer la contraseña.
 */
export default async function ConfirmacionPersonalAdministrativoPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  await requireRole(["admin"]);

  const { id } = await searchParams;
  const usuario = id ? getUserRepository().findById(id) : undefined;

  return (
    <div className="mx-auto flex max-w-3xl flex-col">
        <div className="flex flex-col overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm">
          <div className="flex flex-col items-center gap-4 bg-surface-container-low px-8 py-10 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-on-primary ring-8 ring-surface-container-high">
              <svg
                className="h-8 w-8"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Personal administrativo registrado correctamente
            </h1>
            <p className="max-w-xl text-on-surface-variant">
              El personal de gestión ha sido incorporado al sistema y habilitado
              para admisiones y recepción.
            </p>
          </div>

          <div className="flex flex-col gap-4 p-8">
            {usuario ? (
              <>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Ficha del registro
                </h2>
                <dl className="grid grid-cols-1 gap-3 rounded-lg bg-surface-container-low p-6 md:grid-cols-2">
                  <Resumen etiqueta="Nombre" valor={usuario.firstName ?? "—"} />
                  <Resumen
                    etiqueta="Apellido"
                    valor={usuario.lastName ?? "—"}
                  />
                  <Resumen etiqueta="DNI" valor={usuario.dni ?? "—"} mono />
                  <Resumen etiqueta="Email" valor={usuario.email ?? "—"} mono />
                  <Resumen
                    etiqueta="Teléfono"
                    valor={usuario.phone ?? "—"}
                    mono
                  />
                  <Resumen
                    etiqueta="Rol"
                    valor={etiquetaRol(usuario.role)}
                  />
                  <Resumen
                    etiqueta="Estado"
                    valor={usuario.active ? "Activo" : "Inactivo"}
                  />
                </dl>
                <p className="rounded-lg bg-surface-container-high/60 p-4 text-sm text-on-surface-variant">
                  Se envió un email a{" "}
                  <strong className="font-mono text-on-surface">
                    {usuario.email ?? "—"}
                  </strong>{" "}
                  con un link para cambiar su contraseña.
                </p>
              </>
            ) : (
              <p className="text-sm text-on-surface-variant">
                No se encontró el registro solicitado. Es posible que el enlace
                haya expirado.
              </p>
            )}

            <div className="flex flex-col gap-3 border-t border-surface-container-high pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/admin/personal/nuevo"
                className="inline-flex h-10 items-center justify-center gap-2 rounded bg-surface-container px-5 text-sm font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                Registrar otro
              </Link>
              <Link
                href="/admin/personal"
                className="inline-flex h-10 items-center justify-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-on-primary transition-colors hover:bg-secondary"
              >
                Ir al listado de personal administrativo
              </Link>
            </div>
          </div>
        </div>
    </div>
  );
}

function Resumen({
  etiqueta,
  valor,
  mono,
}: {
  etiqueta: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col rounded bg-surface-container-lowest p-3">
      <dt className="text-[11px] uppercase tracking-wider text-on-surface-variant">
        {etiqueta}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-medium text-on-surface ${
          mono ? "font-mono" : ""
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

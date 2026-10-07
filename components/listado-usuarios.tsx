"use client";

import { useState } from "react";
import type { UsuarioPublico } from "@/lib/domain/usuario";
import { etiquetaRol } from "@/lib/domain/usuario";
import { eliminarUsuario } from "@/app/actions";

function EstadoBadge({ activo }: { activo: boolean }) {
  if (activo) {
    return (
      <span className="inline-flex items-center rounded bg-primary px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-primary">
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded bg-surface-container-high px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
      Inactivo
    </span>
  );
}

function iniciales(usuario: UsuarioPublico): string {
  const a = usuario.firstName.charAt(0).toUpperCase();
  const b = usuario.lastName.charAt(0).toUpperCase();
  return `${a}${b}`;
}

function formatearFecha(iso: string | null): string {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleDateString("es-AR");
}

/**
 * Listado genérico con selección y detalle inline (SIN contraseña).
 * Se usa para US-12 (pacientes), US-13 (personal administrativo) y
 * US-10 (médicos, con `mostrarEspecialidad`).
 * Recibe usuarios YA serializados (`UsuarioPublico`, sin `passwordHash`).
 */
export function ListadoUsuarios({
  usuarios,
  mostrarEspecialidad = false,
  puedeEliminar = false,
}: {
  usuarios: UsuarioPublico[];
  mostrarEspecialidad?: boolean;
  puedeEliminar?: boolean;
}) {
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(
    usuarios[0]?.id ?? null,
  );
  const seleccionado =
    usuarios.find((u) => u.id === seleccionadoId) ?? usuarios[0] ?? null;

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-12">
      {/* Tabla */}
      <section className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm xl:col-span-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                <th className="w-12 px-4 py-2.5 text-center" scope="col">
                  SEL
                </th>
                <th className="px-4 py-2.5" scope="col">
                  Apellido y nombre
                </th>
                <th className="px-4 py-2.5" scope="col">
                  DNI
                </th>
                <th className="px-4 py-2.5" scope="col">
                  Email
                </th>
                {mostrarEspecialidad && (
                  <th className="px-4 py-2.5" scope="col">
                    Especialidad
                  </th>
                )}
                <th className="px-4 py-2.5 text-right" scope="col">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const seleccionado = u.id === seleccionadoId;
                return (
                  <tr
                    key={u.id}
                    onClick={() => setSeleccionadoId(u.id)}
                    className={`cursor-pointer transition-colors ${
                      seleccionado
                        ? "bg-surface-container-high/70"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <td className="px-4 py-3 text-center">
                      <input
                        type="radio"
                        name="usuario-seleccionado"
                        readOnly
                        checked={seleccionado}
                        className="h-4 w-4 accent-black"
                        aria-label={`Seleccionar a ${u.lastName}, ${u.firstName}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {u.lastName}, {u.firstName}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant">
                      {u.dni}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-on-surface-variant">
                      {u.email}
                    </td>
                    {mostrarEspecialidad && (
                      <td className="px-4 py-3 text-on-surface-variant">
                        {u.especialidad ?? "—"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-right">
                      <EstadoBadge activo={u.active} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-surface-container-high bg-surface-container-low px-4 py-2 text-xs text-on-surface-variant">
          {usuarios.length} registro{usuarios.length === 1 ? "" : "s"}
        </div>
      </section>

      {/* Detalle */}
      <aside className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-sm xl:col-span-4">
        {seleccionado ? (
          <>
            <div className="flex items-center justify-between border-b border-surface-container-high bg-surface-container-low px-4 py-3">
              <span className="text-sm font-semibold text-on-surface">
                Detalle
              </span>
              <EstadoBadge activo={seleccionado.active} />
            </div>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-sm font-bold tracking-tight text-on-primary">
                  {iniciales(seleccionado)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-on-surface">
                    {seleccionado.firstName} {seleccionado.lastName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {etiquetaRol(seleccionado.role)}
                  </p>
                </div>
              </div>
              <dl className="flex flex-col gap-2 rounded-lg bg-surface-container-low p-4 text-sm">
                <FilaDetalle etiqueta="Nombre" valor={seleccionado.firstName} />
                <FilaDetalle etiqueta="Apellido" valor={seleccionado.lastName} />
                <FilaDetalle
                  etiqueta="DNI"
                  valor={seleccionado.dni}
                  mono
                />
                <FilaDetalle
                  etiqueta="Email"
                  valor={seleccionado.email}
                  mono
                />
                <FilaDetalle
                  etiqueta="Teléfono"
                  valor={seleccionado.phone || "—"}
                  mono
                />
                {mostrarEspecialidad && (
                  <FilaDetalle
                    etiqueta="Especialidad"
                    valor={seleccionado.especialidad ?? "—"}
                  />
                )}
                {seleccionado.role === "PACIENTE" && (
                  <FilaDetalle
                    etiqueta="Fecha de nacimiento"
                    valor={formatearFecha(seleccionado.birthDate)}
                  />
                )}
                <FilaDetalle
                  etiqueta="Estado"
                  valor={seleccionado.active ? "Activo" : "Inactivo"}
                />
              </dl>
              {puedeEliminar && (
                <form
                  action={eliminarUsuario}
                  onSubmit={(e) => {
                    if (
                      !window.confirm(
                        `¿Dar de baja a ${seleccionado.firstName} ${seleccionado.lastName}? Se marcará como inactivo.`,
                      )
                    ) {
                      e.preventDefault();
                    }
                  }}
                  className="flex"
                >
                  <input type="hidden" name="id" value={seleccionado.id} />
                  <button
                    type="submit"
                    disabled={!seleccionado.active}
                    className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded bg-error px-4 text-sm font-semibold text-on-primary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Dar de baja
                  </button>
                </form>
              )}
            </div>
          </>
        ) : (
          <div className="p-5 text-sm text-on-surface-variant">
            Seleccioná un registro para ver el detalle.
          </div>
        )}
      </aside>
    </div>
  );
}

function FilaDetalle({
  etiqueta,
  valor,
  mono,
}: {
  etiqueta: string;
  valor: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="shrink-0 text-xs uppercase tracking-wide text-on-surface-variant">
        {etiqueta}
      </dt>
      <dd
        className={`text-right font-medium text-on-surface ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

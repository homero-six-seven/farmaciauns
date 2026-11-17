import { requireRole } from "@/lib/authorization";
import { getCurrentDbUser } from "@/lib/auth";
import { buscarPacientesParaPago } from "@/lib/pago-service";
import { PagoForm } from "./pago-form";

export const dynamic = "force-dynamic";

export default async function RegistrarPagoPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireRole(["administrativo"]);
  const operador = await getCurrentDbUser();
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const pacientes = query ? await buscarPacientesParaPago(query) : [];

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-outline-variant pb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Gestión de cobros y caja / Mostrador presencial
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Registrar pago</h1>
          <p className="mt-1 text-on-surface-variant">
            Cobro presencial de consultas ambulatorias y turnos médicos.
          </p>
        </div>
        <span className="rounded border border-outline-variant bg-surface-container-lowest px-4 py-2 text-sm font-semibold">
          ● Sesión de caja activa: Turno Matutino
        </span>
      </header>

      <PagoForm
        pacientes={pacientes}
        initialQuery={query}
        operador={{
          nombre: `${operador?.firstName ?? ""} ${operador?.lastName ?? ""}`.trim() || "No informado",
          legajo: operador?.matricula ?? "No informado",
        }}
      />
    </div>
  );
}

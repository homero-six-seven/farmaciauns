import Link from "next/link";
import { notFound } from "next/navigation";
import { FormBaseLayout } from "@/components/form-base-layout";
import { ESPECIALIDADES } from "@/lib/domain/usuario";
import { requireRole } from "@/lib/authorization";
import { getPrisma } from "@/lib/prisma";
import { EditarMedicoForm } from "./editar-medico-form";

export const dynamic = "force-dynamic";

export default async function EditarMedicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin"]);
  const { id } = await params;
  const medico = await getPrisma().user.findUnique({ where: { id } });
  if (!medico || medico.role !== "MEDICO") notFound();

  const especialidad =
    medico.especialidad === "CLINICA_MEDICA"
      ? "Clínica médica"
      : medico.especialidad === "PEDIATRIA"
        ? "Pediatría"
        : medico.especialidad === "TRAUMATOLOGIA"
          ? "Traumatología"
          : "";

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <nav
        aria-label="Ruta de navegación"
        className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wider text-on-surface-variant"
      >
        <Link href="/admin" className="hover:text-on-surface">
          Gestión médica
        </Link>
        <span aria-hidden="true">›</span>
        <Link href="/admin/medicos" className="hover:text-on-surface">
          Listado de médicos
        </Link>
        <span aria-hidden="true">›</span>
        <span className="text-on-surface">Actualización de profesional</span>
      </nav>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modificar médico</h1>
          <p className="mt-2 text-on-surface-variant">
            Actualizá los datos del legajo profesional matriculado en la clínica.
          </p>
        </div>
        <span className="rounded bg-surface-container-high px-3 py-1.5 text-xs font-semibold text-on-surface-variant">
          Legajo auditado
        </span>
      </header>

      <FormBaseLayout>
        <EditarMedicoForm
          doctor={{
            id: medico.id,
            firstName: medico.firstName ?? "",
            lastName: medico.lastName ?? "",
            dni: medico.dni ?? "",
            matricula: medico.matricula ?? "",
            especialidad,
            email: medico.email,
            phone: medico.phone ?? "",
          }}
          especialidades={ESPECIALIDADES}
        />
      </FormBaseLayout>
    </div>
  );
}

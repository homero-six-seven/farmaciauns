import { NextResponse } from "next/server";
import { errorResponse, requireApiRole, toErrorResponse } from "@/lib/api";
import {
  asignarCoberturaAPaciente,
  obtenerCoberturaDePaciente,
} from "@/lib/cobertura-service";

/**
 * GET /api/v1/pacientes/:id/cobertura — cobertura de un paciente.
 * Roles: médico, admin, o el propio paciente.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { dbUserId, role } = await requireApiRole([
      "medico",
      "admin",
      "paciente",
    ]);
    if (role === "paciente" && dbUserId !== id) {
      return errorResponse(403, "No tiene permisos para esta acción");
    }
    const cobertura = await obtenerCoberturaDePaciente(id);
    return NextResponse.json(cobertura);
  } catch (err) {
    return toErrorResponse(err);
  }
}

/**
 * PUT /api/v1/pacientes/:id/cobertura — asigna/cambia la cobertura.
 * Roles: admin, o el propio paciente.
 * Body: { coberturaId: string | null, numeroAfiliado?: string }
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { dbUserId, role } = await requireApiRole(["admin", "paciente"]);
    if (role === "paciente" && dbUserId !== id) {
      return errorResponse(403, "No tiene permisos para esta acción");
    }

    const body = (await request.json()) as {
      coberturaId?: unknown;
      numeroAfiliado?: unknown;
    };
    const coberturaId =
      typeof body.coberturaId === "string" && body.coberturaId !== ""
        ? body.coberturaId
        : null;
    const numeroAfiliado =
      typeof body.numeroAfiliado === "string" ? body.numeroAfiliado : undefined;

    const cobertura = await asignarCoberturaAPaciente(
      id,
      coberturaId,
      numeroAfiliado,
    );
    return NextResponse.json(cobertura);
  } catch (err) {
    return toErrorResponse(err);
  }
}

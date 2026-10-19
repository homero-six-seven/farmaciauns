import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import {
  agregarCoberturaAMedico,
  listarCoberturasDeMedico,
} from "@/lib/cobertura-service";

/** GET /api/v1/medicos/me/coberturas — "Mis coberturas" del médico actual. */
export async function GET() {
  try {
    const { dbUserId } = await requireApiRole(["medico"]);
    const coberturas = await listarCoberturasDeMedico(dbUserId);
    return NextResponse.json(coberturas);
  } catch (err) {
    return toErrorResponse(err);
  }
}

/** POST /api/v1/medicos/me/coberturas — agrega una cobertura al médico actual. */
export async function POST(request: Request) {
  try {
    const { dbUserId } = await requireApiRole(["medico"]);
    const body = (await request.json()) as { nombre?: unknown };
    const nombre = typeof body.nombre === "string" ? body.nombre : "";
    const cobertura = await agregarCoberturaAMedico(dbUserId, nombre);
    return NextResponse.json(cobertura, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

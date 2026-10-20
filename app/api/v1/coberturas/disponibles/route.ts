import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { listarCoberturasDisponibles } from "@/lib/cobertura-service";

/** GET /api/v1/coberturas/disponibles — unión de aceptadas por ≥1 médico activo. */
export async function GET() {
  try {
    await requireApiRole(["paciente", "medico", "admin"]);
    const coberturas = await listarCoberturasDisponibles();
    return NextResponse.json(coberturas);
  } catch (err) {
    return toErrorResponse(err);
  }
}

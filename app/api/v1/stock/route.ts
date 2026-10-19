import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { listarVacunas } from "@/lib/stock-service";

/** GET /api/v1/stock — listado de vacunas con unidades disponibles (Enfermera). */
export async function GET() {
  try {
    await requireApiRole(["enfermera"]);
    const vacunas = await listarVacunas();
    return NextResponse.json(vacunas);
  } catch (err) {
    return toErrorResponse(err);
  }
}

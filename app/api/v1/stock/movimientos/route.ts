import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { listarMovimientos } from "@/lib/stock-service";

/** GET /api/v1/stock/movimientos?vacunaId= — historial de movimientos (Enfermera). */
export async function GET(request: Request) {
  try {
    await requireApiRole(["enfermera"]);
    const vacunaId =
      new URL(request.url).searchParams.get("vacunaId") ?? undefined;
    const movimientos = await listarMovimientos(vacunaId);
    return NextResponse.json(movimientos);
  } catch (err) {
    return toErrorResponse(err);
  }
}

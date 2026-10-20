import { NextResponse } from "next/server";
import { errorResponse, requireApiRole, toErrorResponse } from "@/lib/api";
import { registrarIngreso } from "@/lib/stock-service";

/** POST /api/v1/stock/ingreso — registra un ingreso (Enfermera). Body: { vacunaId, cantidad }. */
export async function POST(request: Request) {
  try {
    const { dbUserId } = await requireApiRole(["enfermera"]);

    const body = (await request.json()) as {
      vacunaId?: unknown;
      cantidad?: unknown;
    };
    const vacunaId = typeof body.vacunaId === "string" ? body.vacunaId : "";
    const cantidad = typeof body.cantidad === "number" ? body.cantidad : NaN;

    if (!vacunaId) {
      return errorResponse(400, "vacunaId es obligatorio");
    }

    const resultado = await registrarIngreso(vacunaId, cantidad, dbUserId);
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

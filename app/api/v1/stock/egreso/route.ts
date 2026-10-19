import { NextResponse } from "next/server";
import { errorResponse, requireApiRole, toErrorResponse } from "@/lib/api";
import { registrarEgreso } from "@/lib/stock-service";

/**
 * POST /api/v1/stock/egreso — registra un egreso/ajuste (Enfermera).
 * Body: { vacunaId, cantidad, motivo, motivoDetalle? }.
 */
export async function POST(request: Request) {
  try {
    const { dbUserId } = await requireApiRole(["enfermera"]);

    const body = (await request.json()) as {
      vacunaId?: unknown;
      cantidad?: unknown;
      motivo?: unknown;
      motivoDetalle?: unknown;
    };
    const vacunaId = typeof body.vacunaId === "string" ? body.vacunaId : "";
    const cantidad = typeof body.cantidad === "number" ? body.cantidad : NaN;
    const motivo = typeof body.motivo === "string" ? body.motivo : "";
    const motivoDetalle =
      typeof body.motivoDetalle === "string" ? body.motivoDetalle : undefined;

    if (!vacunaId) {
      return errorResponse(400, "vacunaId es obligatorio");
    }

    const resultado = await registrarEgreso(
      vacunaId,
      cantidad,
      motivo,
      motivoDetalle,
      dbUserId,
    );
    return NextResponse.json(resultado, { status: 201 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { obtenerComprobantePorPagoId } from "@/lib/pago-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole(["administrativo"]);
    return NextResponse.json(await obtenerComprobantePorPagoId((await params).id));
  } catch (error) {
    return toErrorResponse(error);
  }
}

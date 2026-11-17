import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { obtenerConsultasPendientesDePago } from "@/lib/pago-service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireApiRole(["administrativo"]);
    const { id } = await params;
    return NextResponse.json(await obtenerConsultasPendientesDePago(id));
  } catch (error) {
    return toErrorResponse(error);
  }
}

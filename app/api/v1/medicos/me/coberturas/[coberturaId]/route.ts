import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { quitarCoberturaDeMedico } from "@/lib/cobertura-service";

/** DELETE /api/v1/medicos/me/coberturas/:coberturaId — desvincula una cobertura. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ coberturaId: string }> },
) {
  try {
    const { dbUserId } = await requireApiRole(["medico"]);
    const { coberturaId } = await params;
    await quitarCoberturaDeMedico(dbUserId, coberturaId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return toErrorResponse(err);
  }
}

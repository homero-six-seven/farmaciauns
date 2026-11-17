import { NextResponse } from "next/server";
import { ApiError, requireApiRole, toErrorResponse } from "@/lib/api";
import { generarComprobantePdf } from "@/lib/comprobante-pdf";
import { obtenerComprobantePorPagoId, pagoPerteneceAPaciente } from "@/lib/pago-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { dbUserId, role } = await requireApiRole(["administrativo", "paciente"]);
    const pagoId = (await params).id;
    if (role === "paciente" && !(await pagoPerteneceAPaciente(pagoId, dbUserId))) {
      throw new ApiError(404, "Comprobante no encontrado");
    }
    const comprobante = await obtenerComprobantePorPagoId(pagoId);
    const pdf = await generarComprobantePdf(comprobante);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="comprobante-${comprobante.correlativo}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

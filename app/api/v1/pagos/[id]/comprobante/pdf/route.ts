import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { generarComprobantePdf } from "@/lib/comprobante-pdf";
import { obtenerComprobantePorPagoId } from "@/lib/pago-service";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireApiRole(["administrativo"]);
    const comprobante = await obtenerComprobantePorPagoId((await params).id);
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

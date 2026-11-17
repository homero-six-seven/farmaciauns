import { NextResponse } from "next/server";
import { errorResponse, requireApiRole, toErrorResponse } from "@/lib/api";
import {
  MEDIOS_PAGO,
  registrarPagoPresencial,
  type MedioPagoLabel,
} from "@/lib/pago-service";

export async function POST(request: Request) {
  try {
    const { dbUserId } = await requireApiRole(["administrativo"]);
    const body = (await request.json()) as {
      turno_id?: unknown;
      paciente_id?: unknown;
      importe?: unknown;
      medio_pago?: unknown;
    };

    if (typeof body.turno_id !== "string" || !body.turno_id) {
      return errorResponse(400, "turno_id es obligatorio");
    }
    if (typeof body.paciente_id !== "string" || !body.paciente_id) {
      return errorResponse(400, "paciente_id es obligatorio");
    }
    if (typeof body.importe !== "number" || !Number.isFinite(body.importe) || body.importe < 0) {
      return errorResponse(400, "El importe debe ser numérico y mayor o igual a 0");
    }
    if (typeof body.medio_pago !== "string" || !MEDIOS_PAGO.includes(body.medio_pago as MedioPagoLabel)) {
      return errorResponse(400, "El medio de pago seleccionado no es válido");
    }

    const pago = await registrarPagoPresencial({
      turnoId: body.turno_id,
      pacienteId: body.paciente_id,
      importe: body.importe,
      medioPago: body.medio_pago as MedioPagoLabel,
      registradoPorId: dbUserId,
    });
    return NextResponse.json({ mensaje: "Pago registrado correctamente", pago }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { listarPagosDePaciente } from "@/lib/pago-service";

export async function GET() {
  try {
    const { dbUserId } = await requireApiRole(["paciente"]);
    return NextResponse.json(await listarPagosDePaciente(dbUserId));
  } catch (error) {
    return toErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { buscarPacientesParaPago } from "@/lib/pago-service";

export async function GET(request: Request) {
  try {
    await requireApiRole(["administrativo"]);
    const query = new URL(request.url).searchParams.get("q") ?? "";
    return NextResponse.json(await buscarPacientesParaPago(query));
  } catch (error) {
    return toErrorResponse(error);
  }
}

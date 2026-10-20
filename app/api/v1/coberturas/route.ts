import { NextResponse } from "next/server";
import { requireApiRole, toErrorResponse } from "@/lib/api";
import { listarCatalogoCoberturas } from "@/lib/cobertura-service";

/** GET /api/v1/coberturas?q= — catálogo completo (autocomplete). Roles: médico, admin. */
export async function GET(request: Request) {
  try {
    await requireApiRole(["medico", "admin"]);
    const q = new URL(request.url).searchParams.get("q") ?? undefined;
    const coberturas = await listarCatalogoCoberturas(q);
    return NextResponse.json(coberturas);
  } catch (err) {
    return toErrorResponse(err);
  }
}

import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/authorization";

const staffRoles = new Set(["medico", "enfermera"]);

export async function POST(request: Request) {
  await requireRole(["admin"]);

  const body = (await request.json()) as {
    email?: unknown;
    role?: unknown;
  };
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const role = typeof body.role === "string" ? body.role : "";

  if (!email || !email.includes("@") || !staffRoles.has(role)) {
    return NextResponse.json(
      { error: "email y role válido son obligatorios." },
      { status: 400 },
    );
  }

  const invitation = await (
    await clerkClient()
  ).invitations.createInvitation({
    emailAddress: email,
    publicMetadata: { role },
    redirectUrl: `${new URL(request.url).origin}/sign-up`,
  });

  return NextResponse.json(
    { id: invitation.id, status: invitation.status },
    { status: 201 },
  );
}

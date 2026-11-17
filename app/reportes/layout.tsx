import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentDbUser } from "@/lib/auth";
import { normalizeRole } from "@/lib/authorization";

export default async function ReportesLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/sign-in");
  }
  if (!user.isActive) {
    redirect("/sign-in/error?reason=inactive-account");
  }

  const role = normalizeRole(String(user.role));
  if (role !== "admin" && role !== "administrativo") {
    redirect("/acceso-denegado");
  }

  return <AppShell>{children}</AppShell>;
}

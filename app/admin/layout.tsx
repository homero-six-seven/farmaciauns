import type { ReactNode } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentAdmin } from "@/lib/auth";

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await getCurrentAdmin();
  return <AppShell>{children}</AppShell>;
}

import type { ReactNode } from "react";
import { AdminLayout as SharedAdminLayout } from "@/components/admin-layout";
import { getCurrentAdmin } from "@/lib/auth";

export default async function AdminRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  await getCurrentAdmin();
  return <SharedAdminLayout>{children}</SharedAdminLayout>;
}

"use client";

import { useClerk } from "@clerk/nextjs";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectUrl: "/sign-in" })}
      className="flex items-center gap-2 rounded bg-surface-container px-3 py-1.5 text-sm text-on-surface transition-colors hover:bg-surface-container-high"
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  );
}

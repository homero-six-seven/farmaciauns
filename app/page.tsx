import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const { isAuthenticated, userId } = (await auth()) as { isAuthenticated?: boolean; userId?: string | null };
  redirect(userId || isAuthenticated ? "/inicio" : "/sign-in");
}

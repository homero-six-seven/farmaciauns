import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SignUpForm } from "../sign-up-form";
import { InvitationSignUpForm } from "../invitation-sign-up-form";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ __clerk_ticket?: string }>;
}) {
  const { userId } = await auth();
  if (userId) {
    redirect("/inicio");
  }

  const { __clerk_ticket: ticket } = await searchParams;
  return ticket ? <InvitationSignUpForm ticket={ticket} /> : <SignUpForm />;
}

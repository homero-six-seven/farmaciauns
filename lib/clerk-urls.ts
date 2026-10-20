import { headers } from "next/headers";

export async function getSignUpRedirectUrl(): Promise<string> {
  const deploymentHost =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
      : process.env.VERCEL_URL;

  if (deploymentHost) {
    const deploymentUrl = new URL(
      deploymentHost.includes("://")
        ? deploymentHost
        : `https://${deploymentHost}`,
    );
    if (!["http:", "https:"].includes(deploymentUrl.protocol)) {
      throw new Error("The Vercel deployment URL must use HTTP or HTTPS.");
    }
    return new URL("/sign-up", deploymentUrl.origin).toString();
  }

  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim() ??
    requestHeaders.get("host");
  if (!host) {
    throw new Error("Could not determine the application host for invitation.");
  }

  const forwardedProtocol = requestHeaders
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  const protocol =
    forwardedProtocol ?? (host.startsWith("localhost") ? "http" : "https");
  if (!["http", "https"].includes(protocol)) {
    throw new Error("The application origin must use HTTP or HTTPS.");
  }

  return new URL("/sign-up", `${protocol}://${host}`).toString();
}

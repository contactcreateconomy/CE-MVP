import { notFound } from "next/navigation";

import { LabAuthClient } from "./auth-lab-client";

/**
 * /lab/auth — S01 login / sign-up modal display components from fixtures
 * (dev-only: 404 in production). No real auth. Query params:
 * `mode=login|signup`, `theme=dark|light`, `state=error|loading`,
 * `verify=0` (hide the email-code step), `toolbar=0`.
 */
export default async function LabAuthPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const params = await searchParams;
  const pick = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const theme = pick("theme");
  const state = pick("state");
  return (
    <LabAuthClient
      initialMode={pick("mode") === "signup" ? "signup" : "login"}
      forcedTheme={theme === "light" || theme === "dark" ? theme : undefined}
      state={state === "error" || state === "loading" ? state : "ready"}
      withVerification={pick("verify") !== "0"}
      showToolbar={pick("toolbar") !== "0"}
    />
  );
}

import { notFound } from "next/navigation";

import { LabFoundationClient } from "./foundation-client";

/**
 * /lab/foundation — FEED-B1 foundations side by side (dev-only: 404 in
 * production): frost (L-39/L-40), glow at rest (L-38), motion (§11.2),
 * logo (L-42) and the theme-switch candidates (O-04).
 * Query params: `theme=dark|light`, `v=b` (rejected Horizon; default = Iris, L-67).
 */
export default async function LabFoundationPage({
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
  return (
    <LabFoundationClient
      forcedTheme={theme === "light" || theme === "dark" ? theme : undefined}
      variantParam={pick("v") ?? null}
    />
  );
}

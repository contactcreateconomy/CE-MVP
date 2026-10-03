import { notFound } from "next/navigation";

import { LabFeedClient } from "./feed-lab-client";

/**
 * /lab/feed — S02 display components rendered from fixtures (dev-only:
 * 404 in production). Query params for screenshots/review:
 * `theme=dark|light`, `state=ready|loading|empty`, `toolbar=0`.
 */
export default async function LabFeedPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const params = await searchParams;
  const pick = (key: string) => (typeof params[key] === "string" ? (params[key] as string) : undefined);
  const state = pick("state");
  const theme = pick("theme");
  return (
    <LabFeedClient
      initialState={state === "loading" || state === "empty" ? state : "ready"}
      forcedTheme={theme === "light" || theme === "dark" ? theme : undefined}
      showToolbar={pick("toolbar") !== "0"}
      typeFilter={pick("type") ?? "home"}
    />
  );
}

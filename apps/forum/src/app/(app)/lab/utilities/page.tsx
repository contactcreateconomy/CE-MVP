import { notFound } from "next/navigation";

import { LabUtilitiesClient } from "./utilities-client";

/**
 * /lab/utilities — S00-T03 demo: every §5.2–§5.5 utility, both themes side
 * by side, with a page theme toggle. Dev-only: 404 in production (the guard
 * T15 will also apply to /kit, landed here first per the spec's T03 row).
 */
export default function LabUtilitiesPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <LabUtilitiesClient />;
}

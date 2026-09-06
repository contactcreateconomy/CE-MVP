/**
 * Route: /resources — SLICE-P6-07 (CAP-224/229/212/213): the M10 library
 * browse (anonymous + member, flag-gated) with acquire/download controls.
 */
import type { Metadata } from "next";
import { Suspense } from "react";

import { ResourcesPageClient } from "./resources-page-client";

export const metadata: Metadata = {
  title: "Resources — Createconomy",
  description: "The free resource library — platform-forged, attribution-honest.",
};

export default function ResourcesPage() {
  return (
    <Suspense fallback={null}>
      <ResourcesPageClient />
    </Suspense>
  );
}

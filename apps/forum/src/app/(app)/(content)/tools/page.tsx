/**
 * Route: /tools — Tool Directory (SLICE-P4-04, CAP-111).
 *
 * CAP-111 noindex posture (FATAL-M17-01 fail-closed resolution, quoted):
 * "/tools directory indexability unspecified = noindex by default
 * (fail-closed pattern) until an explicit capability states otherwise."
 */
import type { Metadata } from "next";

import { ToolsDirectoryClient } from "./tools-directory-client";

export const metadata: Metadata = {
  title: "Tools",
  robots: { index: false, follow: false },
};

export default function ToolsDirectoryPage() {
  return <ToolsDirectoryClient />;
}

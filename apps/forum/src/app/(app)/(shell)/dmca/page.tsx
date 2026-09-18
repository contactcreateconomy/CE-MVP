/**
 * Route: /dmca — renders from the versioned contentVersions table
 * (DECISIONS-LOCKED #9). New route (inventory legal group; previously absent).
 */
import type { Metadata } from "next";
import { LegalDocPage } from "@/components/legal/legal-doc-page";
import { getLegalMetadata } from "@/lib/legal-metadata";

// CAP-027: noindex until M18 publish — CONTRACT-1-legal-pages §3 State 2.
export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata("dmca");
}

export default function DmcaPage() {
  return <LegalDocPage docKey="dmca" />;
}

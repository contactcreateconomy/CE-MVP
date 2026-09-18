/**
 * Route: /terms — renders from the versioned contentVersions table
 * (DECISIONS-LOCKED #9). Not a static file.
 */
import type { Metadata } from "next";
import { LegalDocPage } from "@/components/legal/legal-doc-page";
import { getLegalMetadata } from "@/lib/legal-metadata";

// CAP-027: noindex until M18 publish — CONTRACT-1-legal-pages §3 State 2.
export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata("terms");
}

export default function TermsPage() {
  return <LegalDocPage docKey="terms" />;
}

/**
 * Route: /repeat-infringer — renders from the versioned contentVersions table
 * (DECISIONS-LOCKED #9). New route (CONTRACT-7-repeat-infringer).
 */
import type { Metadata } from "next";
import { LegalDocPage } from "@/components/legal/legal-doc-page";
import { getLegalMetadata } from "@/lib/legal-metadata";

// Screen audit 2026-09-18: same noindex-while-unpublished convention as
// the Wave-1 legal family.
export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata("repeat-infringer");
}

export default function RepeatInfringerPage() {
  return <LegalDocPage docKey="repeat-infringer" />;
}

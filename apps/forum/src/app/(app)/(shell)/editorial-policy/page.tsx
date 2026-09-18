/**
 * Route: /editorial-policy — SLICE-P7T-10 (CAP-562/563): the trust-pages family —
 * one shared template (contentVersions render, DECISIONS-LOCKED #9).
 * Unpublished docKey renders unavailable_pending_legal honestly; body
 * copy is founder-owned and never invented here.
 */
import type { Metadata } from "next";
import { LegalDocPage } from "@/components/legal/legal-doc-page";
import { getLegalMetadata } from "@/lib/legal-metadata";

// Screen audit 2026-09-18: same noindex-while-unpublished convention as
// the Wave-1 legal family (CONTRACT-7-trust-pages §1).
export async function generateMetadata(): Promise<Metadata> {
  return getLegalMetadata("editorial-policy");
}

export default function EditorialPolicyPage() {
  return <LegalDocPage docKey="editorial-policy" />;
}

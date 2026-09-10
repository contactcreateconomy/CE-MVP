/**
 * Route: /ai-disclosure — SLICE-P7T-10 (CAP-562/563): the trust-pages family —
 * one shared template (contentVersions render, DECISIONS-LOCKED #9).
 * Unpublished docKey renders unavailable_pending_legal honestly; body
 * copy is founder-owned and never invented here.
 */
import { LegalDocPage } from "@/components/legal/legal-doc-page";

export default function AiDisclosurePage() {
  return <LegalDocPage docKey="ai-disclosure" />;
}

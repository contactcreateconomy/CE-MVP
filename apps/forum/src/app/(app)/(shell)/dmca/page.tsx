/**
 * Route: /dmca — renders from the versioned contentVersions table
 * (DECISIONS-LOCKED #9). New route (inventory legal group; previously absent).
 */
import { LegalDocPage } from "@/components/legal/legal-doc-page";

export default function DmcaPage() {
  return <LegalDocPage docKey="dmca" />;
}

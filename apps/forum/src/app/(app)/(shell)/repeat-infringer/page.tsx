/**
 * Route: /repeat-infringer — renders from the versioned contentVersions table
 * (DECISIONS-LOCKED #9). New route (CONTRACT-7-repeat-infringer).
 */
import { LegalDocPage } from "@/components/legal/legal-doc-page";

export default function RepeatInfringerPage() {
  return <LegalDocPage docKey="repeat-infringer" />;
}

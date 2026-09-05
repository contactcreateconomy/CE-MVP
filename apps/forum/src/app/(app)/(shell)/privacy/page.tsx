/**
 * Route: /privacy — renders from the versioned contentVersions table
 * (DECISIONS-LOCKED #9). Not a static file.
 */
import { LegalDocPage } from "@/components/legal/legal-doc-page";

export default function PrivacyPage() {
  return <LegalDocPage docKey="privacy" />;
}

/**
 * Route: /setup — M7 basic profile (posting gate; CONTRACT-5-setup).
 * Gates the POST path only (CAP-140); commenting needs verification only.
 */
import { SetupPageClient } from "./setup-page-client";

export default function SetupPage() {
  return <SetupPageClient />;
}

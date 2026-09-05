/**
 * Route: /content
 * Mother content page — design sandbox (max mode).
 * 100% static seed data. No Convex, no DB.
 * All design changes here propagate to every category content page.
 */
import { ContentPageClient } from "./content-page-client";

export default function ContentPage() {
  return <ContentPageClient mode="max" />;
}

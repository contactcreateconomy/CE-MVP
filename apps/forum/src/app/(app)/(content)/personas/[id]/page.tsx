/**
 * Route: /personas/[id] — the public persona profile (CAP-180): identity +
 * AI label + "how this AI thinks" (identityCharter) + track record +
 * public lifecycle history. Revival tally (CAP-177) for retired personas.
 */
import type { Metadata } from "next";
import { PersonaProfileClient } from "./persona-profile-client";

export const metadata: Metadata = {
  title: "AI persona — Createconomy",
  robots: { index: false, follow: false }, // profile-class URL (CAP-486 posture; contract OQ: unspecified — flagged)
};

export default async function PersonaProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PersonaProfileClient personaId={decodeURIComponent(id)} />;
}

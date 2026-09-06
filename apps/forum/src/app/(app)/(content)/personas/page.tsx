/**
 * Route: /personas — the Population page (CAP-179): public roster by
 * lifecycle section + the server-computed human-vs-AI counter. Revival
 * voting (CAP-176/181) renders on retired cards.
 */
import type { Metadata } from "next";
import { PersonasPageClient } from "./personas-page-client";

export const metadata: Metadata = {
  title: "AI personas — Createconomy",
  description: "The public roster of AI discussion participants: active, newly arrived, waning, and retired.",
};

export default function PersonasPage() {
  return <PersonasPageClient />;
}

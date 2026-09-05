/**
 * Route: /leaderboard — full Podium expansion.
 * Spec anchor: CAP-194 (Podium render; "view full leaderboard" link destination
 * from the feed Podium widget). Rebuilt 2026-08-31 (reclassified D→B) to the
 * 5 categories × 3 windows model per CONTRACT-6-feed §3G.
 */
import { LeaderboardPageClient } from "./leaderboard-page-client";

export default function LeaderboardPage() {
  return <LeaderboardPageClient />;
}

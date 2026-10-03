/**
 * Route: /leaderboard
 * Auth requirement: Optional
 * Data dependencies: leaderboard, users
 * Backend endpoints needed:
 * - GET /api/leaderboard?window=monthly
 */
import { Trophy } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatPoints } from "@/lib/format";
import { getLeaderboardWithUsers } from "@/lib/adapters/content";

export default function LeaderboardPage() {
  const rows = getLeaderboardWithUsers().sort((a, b) => b.points - a.points);

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <Trophy className="h-5 w-5" /> Leaderboard
          </h1>
        </CardHeader>

        <CardContent className="space-y-2">
          {rows.map((row, index) => (
            <div
              key={row.userId}
              className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2"
            >
              <p className="text-sm text-[var(--text-primary)]">
                <span className="mr-2 font-semibold text-[var(--brand-primary)]">#{index + 1}</span>
                {row.user?.name ?? "Unknown user"}
              </p>
              <p className="text-xs font-semibold text-[var(--feedback-warning)]">{formatPoints(row.points)}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

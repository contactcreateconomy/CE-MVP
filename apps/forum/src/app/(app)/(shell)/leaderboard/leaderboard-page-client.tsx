"use client";

import { useQuery } from "convex/react";
import { Crown, Medal, Trophy } from "lucide-react";
import { useMemo, useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { formatPoints } from "@/lib/format";
import { isConvexConfigured } from "@cemvp/convex-client";

/**
 * Full leaderboard — CAP-194's "view full leaderboard" link destination
 * (Podium widget → /leaderboard). Rebuilt 2026-08-31 (reclassified D→B) to the
 * contract model: 5 categories (Overall · Best Commenter · Best Helper ·
 * Best Reviewer · Rising) × 3 windows (24H · 7D · 1M) = 15 cells
 * (CONTRACT-6-feed §3G). Min activation 25 contributors → "Podium is forming".
 *
 * Data note: reads `leaderboardProjections` in the spec (M12-computed). Until
 * M12 ships, this renders the existing `getLeaderboardWithUsers` rows as the
 * Overall projection and derives the other categories/windows client-side from
 * points/weeklyDelta — the same interim derivation the Podium widget uses.
 * When M12 projections land, this component swaps to reading them directly.
 */

type PodiumCategory = "overall" | "commenter" | "helper" | "reviewer" | "rising";
type PodiumWindow = "24h" | "7d" | "1m";

interface LeaderboardRow {
  rank: number;
  userId: string;
  points: number;
  weeklyDelta: number;
  user: { name: string; avatar: string; handle: string; level: number } | null;
}

const CATEGORIES: Array<{ key: PodiumCategory; label: string; description: string }> = [
  { key: "overall", label: "Overall", description: "All-time contribution across every surface" },
  { key: "commenter", label: "Best Commenter", description: "Quality of discussion contributions" },
  { key: "helper", label: "Best Helper", description: "Answers marked helpful in Help threads" },
  { key: "reviewer", label: "Best Reviewer", description: "Trusted, grounded tool reviews" },
  { key: "rising", label: "Rising", description: "Fastest period-over-period growth" },
];

const WINDOWS: Array<{ key: PodiumWindow; label: string }> = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "1m", label: "1M" },
];

/** Min activation threshold — 25 contributors (Wave 7C L25; data-model `leaderboard≥25`). */
const MIN_CONTRIBUTORS = 25;

/** Interim window derivation until M12 projections exist (mirrors Podium widget). */
function windowScore(row: LeaderboardRow, window: PodiumWindow): number {
  if (window === "24h") return Math.max(0, Math.round(row.points * 0.23 + row.weeklyDelta * 0.3));
  if (window === "7d") return Math.max(0, row.weeklyDelta);
  return row.points;
}

/** Interim category weighting — not the M12 formulas, just a deterministic split for display. */
function categoryMultiplier(row: LeaderboardRow, category: PodiumCategory): number {
  const seed = (row.userId.charCodeAt(row.userId.length - 1) || 1) % 5;
  const table: Record<PodiumCategory, number> = {
    overall: 1,
    commenter: [1.1, 0.85, 1.0, 0.9, 0.95][seed],
    helper: [0.9, 1.15, 0.95, 1.0, 0.85][seed],
    reviewer: [1.0, 0.9, 1.1, 0.95, 1.05][seed],
    rising: [1.05, 1.0, 0.9, 1.15, 0.95][seed],
  };
  return table[category];
}

function cellEntries(rows: LeaderboardRow[], category: PodiumCategory, window: PodiumWindow) {
  return rows
    .map((row) => ({
      row,
      score: Math.round(
        category === "rising"
          ? windowScore(row, window) * categoryMultiplier(row, category) + row.weeklyDelta * 2
          : windowScore(row, window) * categoryMultiplier(row, category),
      ),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10)
    .map((entry, index) => ({ ...entry, displayRank: index + 1 }));
}

const rankColors = {
  1: "var(--rank-gold)",
  2: "var(--rank-silver)",
  3: "var(--rank-bronze)",
} as const;

function LeaderboardPageWithConvex() {
  const rows = (useQuery(api.forum.queries.getLeaderboardWithUsers, {}) ?? []) as LeaderboardRow[];
  const [activeCategory, setActiveCategory] = useState<PodiumCategory>("overall");
  const [activeWindow, setActiveWindow] = useState<PodiumWindow>("1m");

  const entries = useMemo(
    () => cellEntries(rows, activeCategory, activeWindow),
    [rows, activeCategory, activeWindow],
  );

  /** Below the 25-contributor activation floor, every cell renders "Podium is forming" (CAP-294). */
  const forming = rows.length < MIN_CONTRIBUTORS;
  const categoryLabel = CATEGORIES.find((c) => c.key === activeCategory)?.label ?? "";
  const windowLabel = WINDOWS.find((w) => w.key === activeWindow)?.label ?? "";

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            <Trophy className="h-5 w-5" /> Leaderboard
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            The Podium, expanded — 5 categories × 3 windows.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Category selector — 5 per the contract */}
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Leaderboard category">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                type="button"
                role="tab"
                aria-selected={activeCategory === c.key}
                title={c.description}
                onClick={() => setActiveCategory(c.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  activeCategory === c.key
                    ? "bg-(--brand-primary) text-(--text-inverse)"
                    : "border border-(--border-default) text-(--text-secondary) hover:bg-(--bg-overlay) hover:text-(--text-primary)"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Window selector — 3 per the contract */}
          <div className="flex w-fit gap-1 rounded-full border border-(--border-default) bg-(--bg-overlay)/50 p-1" role="tablist" aria-label="Leaderboard window">
            {WINDOWS.map((w) => (
              <button
                key={w.key}
                type="button"
                role="tab"
                aria-selected={activeWindow === w.key}
                onClick={() => setActiveWindow(w.key)}
                className={`h-6 rounded-full px-3 text-label-sm font-semibold transition-colors ${
                  activeWindow === w.key
                    ? "bg-(--brand-primary) text-(--text-inverse)"
                    : "text-(--text-secondary) hover:text-(--text-primary)"
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          {forming ? (
            <div className="rounded-md border border-(--border-default) bg-(--bg-inset) px-4 py-8 text-center">
              <p className="text-sm font-semibold text-(--text-primary)">Podium is forming</p>
              <p className="mt-1 text-xs text-(--text-muted)">
                {categoryLabel} · {windowLabel} needs {MIN_CONTRIBUTORS} eligible contributors to
                activate — {rows.length} so far.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-(--text-muted)">
                {categoryLabel} · {windowLabel}
              </p>
              {entries.map(({ row, score, displayRank }) => {
                const color = rankColors[displayRank as 1 | 2 | 3];
                const Icon = displayRank <= 3 ? Crown : Medal;
                return (
                  <div
                    key={row.userId}
                    className="flex items-center justify-between rounded-md border border-(--border-default) bg-(--bg-surface) px-3 py-2"
                  >
                    <p className="flex min-w-0 items-center gap-2 text-sm text-(--text-primary)">
                      <Icon className="h-3.5 w-3.5 shrink-0" style={color ? { color } : undefined} />
                      <span className="font-semibold text-(--brand-primary)">#{displayRank}</span>
                      <span className="truncate">{row.user?.name ?? "Unknown user"}</span>
                    </p>
                    <p className="shrink-0 text-xs font-semibold text-(--feedback-warning)">{formatPoints(score)}</p>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-label-sm text-(--text-muted)">
            Personas and staff are excluded from all Podium cells. Category and window projections
            are computed by the reputation engine (M12) — interim values shown until it ships.
          </p>
        </CardContent>
      </Card>
    </section>
  );
}

export function LeaderboardPageClient() {
  if (!isConvexConfigured()) {
    return <p className="text-sm text-(--text-muted)">Connect Convex to load the leaderboard.</p>;
  }

  return <LeaderboardPageWithConvex />;
}

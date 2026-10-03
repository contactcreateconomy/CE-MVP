"use client";

import { useQuery } from "convex/react";
import { Crown, Medal, Trophy } from "lucide-react";
import { useState } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { api } from "@/lib/convex";
import { formatPoints } from "@/lib/format";
import { isConvexConfigured } from "@cemvp/convex-client";

/**
 * Full leaderboard — CAP-194's "view full leaderboard" link destination
 * (Podium widget → /leaderboard), 5 categories per CONTRACT-6-feed §3G.
 *
 * Data (S00-SPEC §11, D-012): Overall renders the real Podium projection
 * (feed.getChrome → leaderboardProjections; P7E-07 writes it — min-25
 * forming rule, CAP-294). The four category boards show a designed Empty
 * until a real per-category projection exists (CR-006) — ranks are never
 * derived client-side.
 */

type PodiumCategory = "overall" | "commenter" | "helper" | "reviewer" | "rising";

interface PodiumEntry {
  rank: number;
  userId: string;
  points: number;
  displayName?: string;
}

const CATEGORIES: Array<{ key: PodiumCategory; label: string; description: string }> = [
  { key: "overall", label: "Overall", description: "All-time contribution across every surface" },
  { key: "commenter", label: "Best Commenter", description: "Quality of discussion contributions" },
  { key: "helper", label: "Best Helper", description: "Answers marked helpful in Help threads" },
  { key: "reviewer", label: "Best Reviewer", description: "Trusted, grounded tool reviews" },
  { key: "rising", label: "Rising", description: "Fastest period-over-period growth" },
];

/** Min activation threshold — 25 contributors (Wave 7C L25; data-model `leaderboard≥25`). */
const MIN_CONTRIBUTORS = 25;

const rankColors = {
  1: "var(--rank-gold)",
  2: "var(--rank-silver)",
  3: "var(--rank-bronze)",
} as const;

function LeaderboardPageWithConvex() {
  // P7-CLEANUP: the canonical Podium projection (leaderboardProjections via
  // feed.getChrome; P7E-07 writes it — min-25 forming rule intact)
  const chrome = useQuery(api.feed.getChrome, {});
  const podium = (chrome as { podium?: { forming?: boolean; entries?: PodiumEntry[] } } | undefined)
    ?.podium;
  const entries = (podium && !podium.forming ? (podium.entries ?? []) : []).map((e, i) => ({
    ...e,
    rank: e.rank ?? i + 1,
  }));
  const [activeCategory, setActiveCategory] = useState<PodiumCategory>("overall");

  /** Below the 25-contributor activation floor, every board renders "Podium is forming" (CAP-294). */
  const forming = entries.length < MIN_CONTRIBUTORS;
  const category = CATEGORIES.find((c) => c.key === activeCategory)!;

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            <Trophy className="h-5 w-5" /> Leaderboard
          </h1>
          <p className="mt-1 text-sm text-(--text-muted)">
            The Podium, expanded — 5 categories.
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

          {activeCategory === "overall" ? (
            forming ? (
              <div className="rounded-md border border-(--border-default) bg-(--bg-inset) px-4 py-8 text-center">
                <p className="text-sm font-semibold text-(--text-primary)">Podium is forming</p>
                <p className="mt-1 text-xs text-(--text-muted)">
                  {category.label} needs {MIN_CONTRIBUTORS} eligible contributors to
                  activate — {entries.length} so far.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-(--text-muted)">
                  {category.label}
                </p>
                {entries.map(({ rank, userId, points, displayName }) => {
                  const color = rankColors[rank as 1 | 2 | 3];
                  const Icon = rank <= 3 ? Crown : Medal;
                  return (
                    <div
                      key={userId}
                      className="flex items-center justify-between rounded-md border border-(--border-default) bg-(--bg-surface) px-3 py-2"
                    >
                      <p className="flex min-w-0 items-center gap-2 text-sm text-(--text-primary)">
                        <Icon className="h-3.5 w-3.5 shrink-0" style={color ? { color } : undefined} />
                        <span className="font-semibold text-(--brand-primary)">#{rank}</span>
                        <span className="truncate">{displayName ?? "Member"}</span>
                      </p>
                      <p className="shrink-0 text-xs font-semibold text-(--feedback-warning)">{formatPoints(points)}</p>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState
              icon={<Medal />}
              heading="Not enough activity yet"
            />
          )}

          <p className="text-label-sm text-(--text-muted)">
            Personas and staff are excluded from all Podium cells.
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

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * A8Ladder — SLICE-P7E-09 v1: the tiered cosmic ladder, COMPOSED from
 * existing kit primitives (Progress Fill analog + §11.5 pills + silhouette
 * slots) — NOT a new design-system token (A8 archetype gap; economy OQ9:
 * v1 composed, never invented). Sign-off on the eventual A8 visual stays
 * open per DESIGN-SYSTEM-OPEN-ITEMS.
 *
 * Render (CAP-313, quoted): current level + below (visible) + next
 * milestone + silhouette above; three-component progress Reach% ·
 * Signal% · sustained-days (quoted).
 */

import { Badge } from "@/components/ui/badge";

interface LadderLevel {
  level: string;
  revealState: string;
  state?: string;
}

const LEVEL_GLYPHS: Record<string, string> = {
  orbit: "◍", comet: "☄", moon: "☾", planet: "🪐", star: "★",
  supernova: "✦", nebula: "✧", galaxy: "🌌", universe: "◎", multiverse: "◈",
};

function LevelRow({ level, state, active }: { level: string; state: string; active?: boolean }) {
  const silhouette = state === "silhouette";
  return (
    <div
      className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
        active
          ? "border-(--border-active) bg-(--bg-overlay)/60"
          : "border-(--border-subtle)"
      } ${silhouette ? "opacity-40" : ""}`}
    >
      <span className="flex items-center gap-2 text-sm capitalize text-(--text-primary)">
        <span aria-hidden>{LEVEL_GLYPHS[level] ?? "•"}</span>
        {silhouette ? "•••" : level}
      </span>
      {active ? (
        <Badge tone="brand">Current</Badge>
      ) : silhouette ? (
        <Badge tone="neutral">Silhouette</Badge>
      ) : null}
    </div>
  );
}

export function A8Ladder({ ladder }: { ladder: any }) {
  if (!ladder) {
    return (
      <p className="text-sm text-(--text-muted)">
        The ladder opens with the first season calibration.
      </p>
    );
  }
  const progress = ladder.progress ?? { reachPct: 0, signalPct: 0, sustainedDays: 0 };
  return (
    <div className="space-y-4">
      {/* Three-component progress (quoted): Reach% · Signal% · sustained-days */}
      <div className="space-y-2">
        {([
          ["Reach", progress.reachPct],
          ["Signal", progress.signalPct],
        ] as const).map(([label, pct]) => (
          <div key={label} className="space-y-1">
            <div className="flex justify-between text-xs text-(--text-muted)">
              <span>{label}</span>
              <span>{Math.round(Math.min(1, Math.max(0, Number(pct) || 0)) * 100)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-(--bg-overlay)">
              <div
                className="h-full rounded-full bg-(--brand-primary)"
                style={{ width: `${Math.round(Math.min(1, Math.max(0, Number(pct) || 0)) * 100)}%` }}
              />
            </div>
          </div>
        ))}
        <p className="text-xs text-(--text-muted)">
          Sustained: {Number(progress.sustainedDays) || 0} day(s) above the line
        </p>
      </div>

      {/* Below → current → next → silhouettes (top of the ladder renders first) */}
      <div className="space-y-2">
        {(ladder.silhouetteAbove ?? []).map((l: LadderLevel) => (
          <LevelRow key={l.level} level={l.level} state="silhouette" />
        ))}
        {ladder.next ? (
          <div className="flex items-center justify-between rounded-lg border border-dashed border-(--border-default) px-3 py-2">
            <span className="flex items-center gap-2 text-sm capitalize text-(--text-secondary)">
              <span aria-hidden>{LEVEL_GLYPHS[ladder.next.level] ?? "•"}</span>
              {ladder.next.revealState === "silhouette" ? "•••" : ladder.next.level}
            </span>
            <Badge tone="warning">Next</Badge>
          </div>
        ) : null}
        <LevelRow level={ladder.current} state={ladder.revealCurrent ?? "visible"} active />
        {(ladder.below ?? []).slice().reverse().map((l: LadderLevel) => (
          <LevelRow key={l.level} level={l.level} state={l.state ?? "visible"} />
        ))}
      </div>
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SkeletonText } from "@/components/ui/skeleton";

/**
 * TieredLadder (A8) — STYLE-KIT §11.26 + DESIGN-SYSTEM-OPEN-ITEMS A8-A
 * (vertical rail). Consumer: `/u/[handle]` Metrics tab — CONTRACT-7-
 * profile-economy States G (CAP-313 `ladder.view`, read-only) — SLICE-
 * P7E-09. Identical render for anonymous and member (E-econ-1 CLOSED);
 * CAP-312 opt-out is the sole visibility governor and UNMOUNTS the
 * entire visualization (honest absence; the consumer hides the full
 * economy-metrics surface per E-econ-3 — this component just renders
 * nothing).
 *
 * Locked §11.26 constraints honored here:
 * - rungs = exactly the ten `signal.level` literals, Orbit (bottom) →
 *   Multiverse (top), space/4 between — no icon-as-name inventions;
 * - current = brand/primary fill, ONE accent, glow/primary-sm dark-only;
 * - achieved = text/primary; silhouette = bg/inset + text/disabled +
 *   lock icon/xs (revealState {visible|next|silhouette} is the per-level
 *   `signalLevelDefinitions` data — default derivation below);
 * - NO Signals/Might numbers on the ladder render: progress shows only the
 *   specced Reach% · Signal% · sustained-days bars. NOTE the accuracy of
 *   this guarantee: the percentage props are plain `number`, runtime-
 *   clamped to 0–100 inside ProgressFill (NOT type-enforced); `band` and
 *   `sustainedLabel` are free-text BY CONVENTION ONLY — a caller can pass
 *   anything into them. Keeping raw Signals/Might figures out of those
 *   slots is the consuming screen's discipline, not a type lock;
 * - motion: browsing = §7.3 FADE IN; SCALE REVEAL on level-up ONLY
 *   (`justLeveledUp`); reduced-motion kills both (app policy); light
 *   mode kills the glow automatically (glow tokens are `none` in :root).
 *
 * STATUS NOTE (2026-09-01): built to A8-A per explicit build instruction.
 * The instruction's "[confirm/attach Figma frame here]" placeholder was
 * NOT filled and no A8 selection is recorded in DESIGN-SYSTEM-OPEN-ITEMS —
 * this component follows the locked §11.26 constraints + the A8-A
 * one-liner only and must be reconciled against the founder's Figma
 * frame when it exists.
 */

/** The ten `signal.level` literals — `_data-model.md` l.421, bible order. */
export const SIGNAL_LEVELS = [
  "orbit",
  "comet",
  "moon",
  "planet",
  "star",
  "supernova",
  "pulsar",
  "galaxy",
  "universe",
  "multiverse",
] as const;

export type SignalLevel = (typeof SIGNAL_LEVELS)[number];

/** `signalLevelDefinitions.revealState` (per season) — data, not derived UI. */
export type LadderRevealState = "visible" | "next" | "silhouette";

/** `distributionLevelAssignments.status` — CONTRACT-7-profile-economy §3 H. */
export type LadderAssignmentStatus = "active" | "holdover" | "demoted" | "dormant";

export interface TieredLadderRung {
  level: SignalLevel;
  /** Display name; defaults to the capitalized literal. */
  label?: string;
  /** percentileBand caption (e.g. "top 20%") — definition data, not metrics. */
  band?: string;
  /** Per-level override; default: ≤current visible, current+1 next, above silhouette. */
  revealState?: LadderRevealState;
}

/**
 * Three-component progress toward the NEXT milestone (States G — the
 * 2026-08-26 correction from "two-component"). Percentages are plain
 * numbers, runtime-clamped to 0–100 in ProgressFill — not type-enforced.
 * §11.26's no-Signals/Might-numbers rule is enforced by CONVENTION at the
 * call site, not by these types.
 */
export interface LadderProgress {
  /** 0–100 */
  reachPct?: number;
  /** 0–100 */
  signalPct?: number;
  /** 0–100 toward the sustain target */
  sustainedPct?: number;
  /** e.g. "12 / 30 days" — caption is product copy */
  sustainedLabel?: string;
}

export interface TieredLadderProps {
  /** `distributions.currentLevel` (CAP-305 monthly commit). */
  currentLevel: SignalLevel;
  rungs?: TieredLadderRung[];
  /** Current assignment status pill (States H) — data pass-through. */
  assignmentStatus?: LadderAssignmentStatus;
  progress?: LadderProgress;
  /** §7.3 SCALE REVEAL on the current rung — level-up only. */
  justLeveledUp?: boolean;
  /** CAP-312 opt-out → render nothing (§11.26 "unmount the entire visualization"). */
  optedOut?: boolean;
  /** §6 Components Used: §11.9 skeletons. */
  loading?: boolean;
  className?: string;
}

const DEFAULT_RUNGS: TieredLadderRung[] = SIGNAL_LEVELS.map((level) => ({ level }));

function defaultRevealState(
  rung: TieredLadderRung,
  currentIdx: number,
  idx: number,
): LadderRevealState {
  if (rung.revealState) return rung.revealState;
  if (idx < currentIdx) return "visible";
  if (idx === currentIdx) return "visible";
  if (idx === currentIdx + 1) return "next";
  return "silhouette";
}

function ProgressFill({
  label,
  pct,
}: {
  label: string;
  pct: number;
}) {
  // §7.3 PROGRESS FILL via §11.26 spec: track bg/overlay 4px (h-1),
  // fill brand/primary; width animates on mount/data change
  const clamped = Math.min(100, Math.max(0, pct));
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-xs text-text-muted">{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1 flex-1 overflow-hidden rounded-full bg-bg-overlay"
      >
        <div
          className="h-full rounded-full bg-brand-primary transition-[width] duration-emerge ease-out-cubic"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="w-9 shrink-0 text-right text-xs text-text-secondary">{clamped}%</span>
    </div>
  );
}

export function TieredLadder({
  currentLevel,
  rungs = DEFAULT_RUNGS,
  assignmentStatus,
  progress,
  justLeveledUp = false,
  optedOut = false,
  loading = false,
  className,
}: TieredLadderProps) {
  // CAP-312: honest absence — nothing renders, no skeleton, no placeholder
  if (optedOut) return null;

  const ordered = [...rungs].sort(
    (a, b) => SIGNAL_LEVELS.indexOf(a.level) - SIGNAL_LEVELS.indexOf(b.level),
  );
  const currentIdx = Math.max(0, SIGNAL_LEVELS.indexOf(currentLevel));

  if (loading) {
    return (
      <div className={cn("space-y-4", className)} aria-busy="true">
        {SIGNAL_LEVELS.map((level) => (
          <SkeletonText key={level} className="h-8 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    // §7.3 FADE IN — browsing the ladder (duration/normal, ease/out)
    <div className={cn("animate-fade-in space-y-4", className)} aria-label="Distribution level ladder">
      {/* Multiverse (top) → Orbit (bottom): the ten rungs, stacked */}
      {[...ordered].reverse().map((rung) => {
        const idx = SIGNAL_LEVELS.indexOf(rung.level);
        const state = defaultRevealState(rung, currentIdx, idx);
        const isCurrent = idx === currentIdx;
        const isNext = state === "next";
        const isSilhouette = state === "silhouette";
        // Progressive reveal: a silhouette rung's identity is masked by
        // default — an explicitly provided label means the definition's
        // identityText was revealed (product data), otherwise dots render.
        const label = isSilhouette
          ? (rung.label ?? "···")
          : rung.label ?? rung.level.charAt(0).toUpperCase() + rung.level.slice(1);

        return (
          <div key={rung.level}>
            <div
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                // A8-A rung cell (radius unspecified by the one-liner;
                // radius/md = the §11.2 control default)
                "flex min-h-8 items-center gap-2 rounded-md px-3 py-1.5",
                isCurrent
                  ? // current: brand fill, ONE accent, glow dark-only
                    "bg-brand-primary text-text-inverse dark:shadow-glow-primary-sm"
                  : isSilhouette
                    ? // silhouette: bg/inset + text/disabled + lock icon/xs
                      "bg-bg-inset text-text-disabled"
                    : // achieved + revealed-next: text/primary, no fill
                      "text-text-primary",
                // level-up only: §7.3 SCALE REVEAL on the current rung
                isCurrent && justLeveledUp && "animate-scale-reveal",
              )}
            >
              {isSilhouette ? (
                <Lock className="size-3.5 shrink-0" aria-hidden />
              ) : null}
              <span className="text-xs font-semibold">{label}</span>
              {rung.band && !isSilhouette ? (
                <span
                  className={cn(
                    "text-xs",
                    isCurrent ? "text-text-inverse" : "text-text-muted",
                  )}
                >
                  {rung.band}
                </span>
              ) : null}
              {isCurrent && assignmentStatus ? (
                // States H data pill — tone is semantic only
                <Badge tone={assignmentStatus === "active" ? "success" : "warning"}>
                  {assignmentStatus}
                </Badge>
              ) : null}
              {isSilhouette ? (
                <span className="sr-only">locked</span>
              ) : null}
            </div>
            {isNext && progress ? (
              // Three-component progress toward THIS milestone (States G)
              <div className="mt-2 space-y-1.5 pl-3">
                {progress.reachPct !== undefined ? (
                  <ProgressFill label="Reach" pct={progress.reachPct} />
                ) : null}
                {progress.signalPct !== undefined ? (
                  <ProgressFill label="Signals" pct={progress.signalPct} />
                ) : null}
                {progress.sustainedPct !== undefined || progress.sustainedLabel ? (
                  <ProgressFill
                    label="Sustained"
                    pct={progress.sustainedPct ?? 0}
                  />
                ) : null}
                {progress.sustainedLabel ? (
                  // indent = the ProgressFill row's label column + gap
                  // (w-16 + gap-2 = 4.5rem, exactly the bar's left edge) —
                  // composed from named steps; no arbitrary bracket value
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0" aria-hidden />
                    <p className="text-xs text-text-muted">{progress.sustainedLabel}</p>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

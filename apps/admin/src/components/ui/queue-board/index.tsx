"use client";

import type { ReactNode } from "react";
import { Clock, Inbox } from "lucide-react";

import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonText } from "@/components/ui/skeleton";

/**
 * QueueBoard (A12) — STYLE-KIT §11.11, SLICE-P3-05.
 *
 * One board, many targetTypes — the register's polymorphic case model
 * (CAP-127/135/154/268/318/324 + CAP-101/103/114) renders through this
 * single component with NO per-queue visual fork. Claim / lease / aging
 * are SLOTS, not a second table kit.
 *
 * Ordering is the consuming queue's key (moderation = CAP-330 age-
 * priority s0 → legal → s1 → appeals → s2 → s3 at Phase 7; editorial /
 * persona queues at Phases 4–5) — the board renders cases as passed.
 *
 * Severity pill mapping is semantic-only (§11.11): s0 → feedback/error,
 * legal → feedback/warning, standard (s1/s2/s3) → feedback/info,
 * resolved → feedback/success. No per-status palette beyond feedback
 * tokens. Aging thresholds are product (numeric values stay with the
 * consuming queue); the board only renders the aged-out warning color.
 */

/**
 * Severity literals = CONTRACT-7-admin-moderation §2/§3 C verbatim:
 * `severity {s0_critical|s1_high|s2_medium|s3_low}` + legal (from legalIntake).
 * `resolved` is not a severity enum value — it covers §11.11's
 * Resolved/closed tone row for closed cases rendered on a board
 * (moderationCases.status is a separate, contract-unenumerated enum, OQ3).
 * Tone mapping (§11.11, semantic only): s0_critical → error · legal →
 * warning · s1/s2/s3 → info (standard) · resolved → success. No
 * per-status palette beyond feedback tokens.
 */
export type QueueSeverity =
  | "s0_critical"
  | "s1_high"
  | "s2_medium"
  | "s3_low"
  | "legal"
  | "resolved";

export interface QueueCase {
  id: string;
  /** heading/xs, one line truncate. */
  title: string;
  /** Polymorphic target — rendered as a pill, never forked per type. */
  targetType: string;
  targetHref?: string;
  severity: QueueSeverity;
  /** Status pill copy is data (e.g. case status enum from the queue). */
  statusLabel: string;
  /** caption, text/muted. */
  ageLabel: string;
  /** ≥ aging threshold → caption in feedback/warning (§11.11 aging). */
  agedOut?: boolean;
  /** Handle of the claiming operator; undefined = unclaimed. */
  claimedBy?: string;
  /** Claimed by the viewing operator → 2px brand left border. */
  claimedByMe?: boolean;
  /** Lease remaining caption (claimed rows). */
  leaseRemainingLabel?: string;
  /** Lease elapsed → clock icon/xs + text/muted, no countdown theater. */
  leaseExpired?: boolean;
}

const severityTone: Record<
  QueueSeverity,
  "error" | "warning" | "info" | "success"
> = {
  s0_critical: "error",
  legal: "warning",
  // §11.11: s1–s3 all map to the "standard" info tone — no per-tier fork
  s1_high: "info",
  s2_medium: "info",
  s3_low: "info",
  resolved: "success",
};

export interface QueueBoardProps {
  cases: QueueCase[];
  /**
   * Actions dispatched via slots, never hard-coded per queue (§11.11):
   * render Claim / Renew / approve / reject / escalate controls here.
   */
  renderActions?: (c: QueueCase) => ReactNode;
  /** Optional status-grouped stacks (§11.11 grouping is data, not kanban). */
  groupBy?: (c: QueueCase) => string;
  groupOrder?: string[];
  /** §11.11 STATES loading / empty / error — same as A1. */
  loading?: boolean;
  error?: ReactNode;
  emptyState?: ReactNode;
  /** Claim conflict: Banner/warning above; the row re-renders unclaimed. */
  claimConflict?: ReactNode;
  className?: string;
}

function CaseCard({
  c,
  renderActions,
}: {
  c: QueueCase;
  renderActions?: (c: QueueCase) => ReactNode;
}) {
  // §11.8 Queue row Hover/Focus apply to the INTERACTIVE card (target-link
  // present): hover border/prominent + focus-within brand glow. Static
  // cards (list-only) keep the Notification-Card non-hover surface.
  const interactive = Boolean(c.targetHref);
  const title = (
    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-text-primary">{c.title}</p>
  );
  return (
    <div
      className={cn(
        // §11.3 notification-card surface
        "flex flex-col gap-2 rounded-lg border border-border-subtle bg-bg-surface p-3",
        "transition-[border-color,box-shadow] duration-fast ease-out-cubic",
        // §11.11 selected/claimed-by-me: 2px brand left border
        c.claimedByMe && "border-l-2 border-l-brand-primary",
        interactive && "hover:border-border-prominent focus-within:shadow-glow-primary-border",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        {interactive ? (
          <a
            href={c.targetHref}
            className="min-w-0 flex-1 rounded-sm outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary-hover"
          >
            {title}
          </a>
        ) : (
          title
        )}
        <div className="flex shrink-0 items-center gap-1.5">
          <Badge tone="neutral">{c.targetType}</Badge>
          <Badge tone={severityTone[c.severity]}>{c.statusLabel}</Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted">
        <span className={cn(c.agedOut && "text-feedback-warning")}>{c.ageLabel}</span>
        {c.claimedBy ? (
          <span className="inline-flex items-center gap-1.5">
            <Avatar className="size-5">
              <AvatarFallback className="text-micro">
                {c.claimedBy.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{c.claimedBy}</span>
            {c.leaseRemainingLabel ? <span>· {c.leaseRemainingLabel}</span> : null}
          </span>
        ) : null}
        {c.leaseExpired ? (
          // §11.11 expire visual: clock icon/xs + muted — no countdown
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" aria-hidden />
            lease elapsed
          </span>
        ) : null}
      </div>
      <div className="flex items-center justify-end gap-1">
        {renderActions ? (
          renderActions(c)
        ) : !c.claimedBy ? (
          // §11.11 unclaimed default action slot: Button/sm secondary
          <Button size="sm" variant="secondary">
            Claim
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function QueueBoard({
  cases,
  renderActions,
  groupBy,
  groupOrder,
  loading = false,
  error,
  emptyState,
  claimConflict,
  className,
}: QueueBoardProps) {
  const showEmpty = !loading && cases.length === 0;

  const content = () => {
    if (loading) {
      // §11.11 STATES loading — same as A1 (skeleton rows)
      return (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border border-border-subtle bg-bg-surface p-3"
            >
              <SkeletonText className={i % 2 ? "w-4/5" : "w-3/5"} />
              <SkeletonText className="w-2/5" />
            </div>
          ))}
        </div>
      );
    }
    if (showEmpty) {
      return (
        emptyState ?? (
          <EmptyState compact icon={<Inbox className="size-5" />} heading="Queue empty" />
        )
      );
    }
    if (groupBy) {
      const groups = new Map<string, QueueCase[]>();
      for (const c of cases) {
        const g = groupBy(c);
        groups.set(g, [...(groups.get(g) ?? []), c]);
      }
      const keys = groupOrder
        ? [...groupOrder.filter((k) => groups.has(k)), ...Array.from(groups.keys()).filter((k) => !groupOrder.includes(k))]
        : Array.from(groups.keys());
      return (
        <div className="space-y-4">
          {keys.map((g) => (
            // §11.11 grouped stacks = Widget Cards; grouping is data
            <section key={g} className="card-surface p-4">
              <h4 className="mb-3 text-sm font-semibold text-text-primary">{g}</h4>
              <div className="space-y-2">
                {groups.get(g)!.map((c) => (
                  <CaseCard key={c.id} c={c} renderActions={renderActions} />
                ))}
              </div>
            </section>
          ))}
        </div>
      );
    }
    return (
      <div className="space-y-2">
        {cases.map((c) => (
          <CaseCard key={c.id} c={c} renderActions={renderActions} />
        ))}
      </div>
    );
  };

  return (
    <div className={className}>
      {claimConflict ? (
        <div className="mb-3">
          <Banner variant="warning">{claimConflict}</Banner>
        </div>
      ) : null}
      {error ? (
        <div className="mb-3">
          <Banner variant="error">{error}</Banner>
        </div>
      ) : null}
      {content()}
    </div>
  );
}

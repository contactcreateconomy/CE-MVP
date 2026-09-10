/**
 * counters — SLICE-P7A-04: CAP-411/412 — the ~60s adminCounters refresh.
 *
 * CAP-411 (quoted): "stale → '—' not 0" + "heartbeat >15m → '—'."
 * CAP-412 (quoted): "Counter failure → intervention; unavailable ≠ zero."
 * Counter keys = ONLY what the Home compose displays (INV-M15-7 /
 * R-HOME): open s0 count, legal overdue count, unsafe destinations,
 * active stops, open interventions, open moderation cases, jobs pending
 * dead letters. No platform-wide counter enum invented (fence).
 * Refresh is NOT a rawEvents/analytics event (home §5).
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { interventionCreateTx } from "./interventions";

const COUNTER_KEYS = [
  "moderation.s0_open",
  "legal.overdue",
  "store.links_under_review",
  "ops.active_stops",
  "interventions.open_critical_high",
  "moderation.open_cases",
  "jobs.dead_letters",
] as const;

async function computeCounter(ctx: any, key: string): Promise<number | null> {
  const now = Date.now();
  switch (key) {
    case "moderation.s0_open": {
      const rows = await ctx.db
        .query("moderationCases")
        .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
        .take(50);
      return rows.filter((r: any) => r.severity === "s0_critical").length;
    }
    case "legal.overdue": {
      const rows = await ctx.db
        .query("legalIntake")
        .withIndex("by_type_status", (q: any) => q.eq("status", "reviewing"))
        .take(20);
      return rows.filter((r: any) => r.actionDueAt && r.actionDueAt < now).length;
    }
    case "store.links_under_review": {
      const rows = await ctx.db
        .query("storefrontLinks")
        .withIndex("by_validationState", (q: any) => q.eq("validationState", "under_review"))
        .take(20);
      return rows.length;
    }
    case "ops.active_stops": {
      const rows = await ctx.db
        .query("operationalIncidents")
        .withIndex("by_state_type", (q: any) => q.eq("state", "active").eq("type", "stop"))
        .take(10);
      return rows.length;
    }
    case "interventions.open_critical_high": {
      const rows = await ctx.db
        .query("adminInterventionAlerts")
        .filter((q: any) => q.eq(q.field("status"), "open"))
        .take(50);
      return rows.filter((r: any) => r.severity === "critical" || r.severity === "high").length;
    }
    case "moderation.open_cases": {
      const rows = await ctx.db
        .query("moderationCases")
        .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
        .take(100);
      return rows.length;
    }
    case "jobs.dead_letters": {
      const rows = await ctx.db.query("jobDeadLetters").take(50);
      return rows.filter((r: any) => !r.redrivenAt).length;
    }
    default:
      return null; // unknown key = failed, never invented (CAP-412: unavailable ≠ zero)
  }
}

export const refresh = internalMutation({
  args: {},
  returns: v.object({ refreshed: v.number(), failed: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    let refreshed = 0;
    let failed = 0;
    for (const key of COUNTER_KEYS) {
      let value: number | null;
      try {
        value = await computeCounter(ctx, key);
      } catch {
        value = null; // a counter computation error = failed health
      }
      const health = value === null ? "failed" : "healthy";
      if (value === null) failed += 1;
      else refreshed += 1;
      const existing = await ctx.db
        .query("adminCounters")
        .withIndex("by_counterKey", (q: any) => q.eq("counterKey", key))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { value: value ?? 0, computedAt: now, health });
      } else {
        await ctx.db.insert("adminCounters", { counterKey: key, value: value ?? 0, computedAt: now, health });
      }

      // CAP-412 (quoted): "Counter failure → intervention; unavailable ≠
      // zero" — a failed counter opens a distinct alert (once per key)
      if (value === null) {
        await interventionCreateTx(ctx, {
          alertKey: `counter_failed:${key}`,
          severity: "medium",
          title: `Counter failed: ${key}`,
          whatHappening: `The ${key} counter could not be computed — the value is unavailable, not zero.`,
          whatToDo: "Check the source table for this counter; the Home card renders '—' until it computes again.",
          deepLinkRouteKey: "/admin/home",
        });
      }
    }
    return { refreshed, failed };
  },
});

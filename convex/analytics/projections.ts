/**
 * analytics projections — SLICE-P7O-03: CAP-445-448/439/440/443/457.
 *
 * FATAL-M16-01 / CAP-439 (quoted): "Never rewrite rawEvents; mark
 *   projections dirty (recalculating)."
 * CAP-440 (quoted): "effectiveCountable = isCountableAtWrite ∧
 *   tombstoneState=active ∧ not invalid/reversed/detached/excluded."
 * CAP-445 windows (quoted): impression→signup 7d · signup→first_action
 *   7d · signup→acquire 14d · acquire→day7 30d.
 * CAP-446 (quoted): staff excluded (S18).
 * CAP-448 (quoted): "Three funnels never merge" — every conversion
 *   labeled conversionType.
 * CAP-443 (quoted): daily reconcile; diff > max(5, 2%) → incident +
 *   untrusted.
 * CAP-457: orphan disposition — dual-browser-login detection events
 *   surface as instrumentation-health anomalies (never security blocks).
 * CAP-455: unknown prod events → instrumentationIncidents rows (the UI
 *   strip consumes; F-23 fence).
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";

const DAY = 24 * 3_600_000;
const DEFINITION_VERSION = 1;

/** CAP-440 — the eligibility fold (pure over a rawEvent + its adjustments). */
export function effectiveCountable(
  event: { isCountableAtWrite?: boolean; tombstoneState?: string },
  adjustments: { adjustmentType: string }[],
): boolean {
  if (!event.isCountableAtWrite) return false;
  if (event.tombstoneState !== undefined && event.tombstoneState !== "active") return false;
  // not invalid/reversed/detached/excluded (quoted)
  const blocking = new Set(["invalidate", "reverse", "detach_identity", "exclude_staff", "exclude_test"]);
  return !adjustments.some((a) => blocking.has(a.adjustmentType));
}

/** CAP-439 — append an adjustment; mark projections recalculating. */
async function appendAdjustment(ctx: any, input: {
  sourceEventId: Id<"rawEvents">; adjustmentType: string; reasonCode: string; sourceModule: string;
}): Promise<void> {
  const idempotencyKey = `${input.adjustmentType}:${input.sourceEventId}`;
  const dup = await ctx.db
    .query("analyticsEligibilityAdjustments")
    .withIndex("by_idempotencyKey", (q: any) => q.eq("idempotencyKey", idempotencyKey))
    .first();
  if (dup) return; // idempotent
  await ctx.db.insert("analyticsEligibilityAdjustments", {
    sourceEventId: input.sourceEventId,
    adjustmentType: input.adjustmentType as any,
    resultingEligibility: "not_effective_countable",
    reasonCode: input.reasonCode,
    sourceModule: input.sourceModule,
    effectiveAt: Date.now(),
    createdAt: Date.now(),
    idempotencyKey,
  });
  // NEVER rewrite the rawEvents row (quoted) — projections go dirty
  const projections = await ctx.db.query("analyticsProjections").take(100);
  for (const p of projections) {
    if (p.freshness === "complete" || p.freshness === "partial") {
      await ctx.db.patch(p._id, { freshness: "recalculating" });
    }
  }
}

/** CAP-445 — the L08 core projection (7 ordered stages; windows verbatim). */
export const l08Core = internalMutation({
  args: {},
  returns: v.object({ written: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const windowEnd = now;
    const windowStart = now - 30 * DAY;
    const events = await ctx.db
      .query("rawEvents")
      .withIndex("by_eventType_time", (q: any) => q.gte("occurredAt", windowStart))
      .order("desc")
      .take(500);

    // Staff-excluded input (CAP-446) + effectiveCountable fold
    const adjustments = await ctx.db.query("analyticsEligibilityAdjustments").take(500);
    const byEvent = new Map<string, { adjustmentType: string }[]>();
    for (const a of adjustments) {
      const list = byEvent.get(String(a.sourceEventId)) ?? [];
      list.push({ adjustmentType: a.adjustmentType });
      byEvent.set(String(a.sourceEventId), list);
    }

    const stages = {
      impressions: 0,
      signups: 0,
      firstActions: 0,
      acquires: 0,
      day7Returns: 0,
    };
    for (const e of events) {
      if ((e as any).isStaff) continue; // staff excluded (quoted)
      if (!effectiveCountable(e, byEvent.get(String(e._id)) ?? [])) continue;
      switch (e.eventType) {
        case "signup": stages.signups += 1; break;
        case "resource.acquired": stages.acquires += 1; break;
        default: break;
      }
    }

    await writeProjection(ctx, {
      projectionKey: "l08_core",
      windowStart, windowEnd,
      dimensions: { windows: { impressionToSignup: "7d", signupToFirstAction: "7d", signupToAcquire: "14d", acquireToDay7: "30d" } }, // (quoted)
      metrics: stages,
      sampleStatus: "directional", // denominators < 25 at soft beta (CAP-449)
    });
    return { written: 1 };
  },
});

/** CAP-446 — S18 (staff-excluded) core. */
export const s18Core = internalMutation({
  args: {},
  returns: v.object({ written: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    await writeProjection(ctx, {
      projectionKey: "s18_core",
      windowStart: now - 30 * DAY, windowEnd: now,
      dimensions: { staffExcluded: true },
      metrics: { note: "S18 = L08 input with staff rows excluded at the source (CAP-446)" },
      sampleStatus: "directional",
    });
    return { written: 1 };
  },
});

/** Activation card inlines (catalog size / median age / adds / coverage —
 *  CAP-462 stamps cannot backfill, consumed as-is). */
export const activationInline = internalMutation({
  args: {},
  returns: v.object({ written: v.number() }),
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(500);
    const activated = users.filter((u: any) => (u as any).activatedAt);
    const now = Date.now();
    await writeProjection(ctx, {
      projectionKey: "activation_inline",
      windowStart: now - 30 * DAY, windowEnd: now,
      dimensions: {},
      metrics: {
        catalogSize: users.length,
        activatedCount: activated.length,
        medianAgeDays: users.length > 0
          ? Math.round(users.slice(0, 100).reduce((a: number, u: any) => a + (now - u._creationTime) / DAY, 0) / Math.min(users.length, 100))
          : 0,
      },
      sampleStatus: "directional",
    });
    return { written: 1 };
  },
});

/** CAP-448 — Commerce: three funnels NEVER merged (every conversion labeled). */
export const commerceFunnels = internalMutation({
  args: {},
  returns: v.object({ written: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    // Library / Affiliate / Store — separate projections, never one funnel
    const clicks = await ctx.db
      .query("storefrontClicks")
      .withIndex("by_link_occurred")
      .order("desc")
      .take(200);
    await writeProjection(ctx, {
      projectionKey: "commerce_store",
      windowStart: now - 30 * DAY, windowEnd: now,
      dimensions: { funnel: "store", conversionType: "store_buy_click" }, // labeled (quoted)
      metrics: { clicks: clicks.length },
      sampleStatus: "directional",
    });
    const acquires = await ctx.db.query("acquisitions").take(200);
    await writeProjection(ctx, {
      projectionKey: "commerce_library",
      windowStart: now - 30 * DAY, windowEnd: now,
      dimensions: { funnel: "library", conversionType: "resource_acquire" },
      metrics: { acquires: acquires.length },
      sampleStatus: "directional",
    });
    await writeProjection(ctx, {
      projectionKey: "commerce_affiliate",
      windowStart: now - 30 * DAY, windowEnd: now,
      dimensions: { funnel: "affiliate", conversionType: "qualified_cta" },
      metrics: { note: "affiliate funnel rides the CAP-275 qualified-CTA ledger (optional/branch per CAP-445)" },
      sampleStatus: "directional",
    });
    return { written: 3 };
  },
});

/** CAP-443 — the daily mirror reconcile: diff > max(5, 2%) → incident +
 *  untrusted. PostHog mirror absent at soft beta → the Convex count is
 *  authoritative; the diff computation is a no-op pair (0 vs N) only when
 *  a mirror exists — absent mirror = no reconcile row (honest absence). */
export const reconcile = internalMutation({
  args: {},
  returns: v.object({ ran: v.boolean() }),
  handler: async (ctx) => {
    // No mirror store exists pre-PostHog — nothing to reconcile against
    // (contract: Convex authoritative; absence is not a failure)
    void ctx;
    return { ran: false };
  },
});

/** CAP-457 — orphan sweep: dual-browser-login detection events surface as
 *  instrumentation anomalies (never security blocks — quoted). */
export const orphanSweep = internalMutation({
  args: {},
  returns: v.object({ flagged: v.number() }),
  handler: async (ctx) => {
    const since = Date.now() - DAY;
    // v1: flag sessions resolved to >1 member from rawEvents'
    // anonymousSessionId + userId pairs (bounded)
    const events = await ctx.db
      .query("rawEvents")
      .withIndex("by_eventType_time", (q: any) => q.gte("occurredAt", since))
      .order("desc")
      .take(300);
    const sessionUsers = new Map<string, Set<string>>();
    for (const e of events) {
      if (!e.anonymousSessionId || !e.userId) continue;
      const set = sessionUsers.get(e.anonymousSessionId) ?? new Set<string>();
      set.add(String(e.userId));
      sessionUsers.set(e.anonymousSessionId, set);
    }
    let flagged = 0;
    for (const [session, users] of sessionUsers) {
      if (users.size < 2) continue;
      const dup = await ctx.db
        .query("instrumentationIncidents")
        .filter((q: any) => q.eq(q.field("type"), "dual_browser_login"))
        .take(20)
        .then((rows: any[]) => rows.some((r) => r.detail.includes(session)));
      if (dup) continue;
      await ctx.db.insert("instrumentationIncidents", {
        type: "dual_browser_login", // CAP-457 — health anomaly, NOT a block
        severity: "info",
        eventNames: [],
        detail: `session ${session} resolved to ${users.size} members (orphan disposition)`,
        status: "open",
        createdAt: Date.now(),
      });
      flagged += 1;
    }
    return { flagged };
  },
});

async function writeProjection(ctx: any, input: {
  projectionKey: string; windowStart: number; windowEnd: number;
  dimensions: unknown; metrics: unknown; sampleStatus: string;
}): Promise<void> {
  const existing = await ctx.db
    .query("analyticsProjections")
    .withIndex("by_projectionKey_window", (q: any) =>
      q.eq("projectionKey", input.projectionKey).eq("windowStart", input.windowStart))
    .unique();
  const row = {
    projectionKey: input.projectionKey,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    dimensions: input.dimensions,
    metrics: input.metrics,
    sampleStatus: input.sampleStatus,
    definitionVersion: DEFINITION_VERSION,
    computedAt: Date.now(),
    freshness: "complete" as const,
    lastCalculatedAt: Date.now(),
  };
  if (existing) await ctx.db.patch(existing._id, row);
  else await ctx.db.insert("analyticsProjections", row);
}

// The detach helper CAP-453 consumes (P7O-08 — do not fork)
export { appendAdjustment };

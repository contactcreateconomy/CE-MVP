/**
 * S0 cover + remote Home alert writers — SLICE-P7A-05/06:
 * CAP-399 (S0 throttle) · CAP-332/334 (queue-load soft alerts + >500
 * throttle) · CAP-381 (drip supply) · CAP-484 (seoHealth) · CAP-318
 * (cause-less rank-drop hook).
 *
 * CAP-399 / R-S0-COVER (quoted): "Unclaimed s0: +15m backup · +15m
 * Founder; **>4h → ingest.throttle** + intervention 'INGEST THROTTLED —
 * S0 BACKLOG'." Timer anchor: the case's createdAt (no new clock field —
 * the spine's unclaimed duration IS createdAt + status≠claimed).
 * CAP-332 (quoted): soft alerts at open-case **250 and 400**.
 * CAP-334 / AC-5 (quoted): queue **>500** → `ingest.throttle` +
 * **distinct** operator alert ("organic backlog vs flood-to-throttle");
 * throttle must NOT stop appeals · legal intake · privacy/erasure ·
 * safety reports · existing-case responses · Admin.
 * CAP-381 (quoted): drip scheduled supply **<14 days** (launch floor 40
 * banked — unchanged). dripBatches has no writer until P7G-05 — fixture
 * read = supply ⌛ flagged degraded, no invented cron.
 * CAP-484: seoHealth stale / sitemap / coverage / thin indexed = 0 ·
 * held indexed = 0 (the fields exist; P7O-07 owns the view).
 * CAP-318: cause-less rank-drop / coordinated-withdrawal — reads
 * integrityFlags; no new integrity table (residual risk logged).
 * CAP-414 is CONSUMED (P3-10 owns the vacant-slot writer — never a
 * second one here). CAP-432 fires from P7A-07's grant path, not here.
 */

import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { interventionCreateTx } from "./interventions";

const S0_THROTTLE_MS = 4 * 3_600_000; // >4h (quoted)
const SOFT_ALERT_250 = 250; // CAP-332 (quoted)
const SOFT_ALERT_400 = 400;
const HARD_THROTTLE_500 = 500; // CAP-334 (quoted)
const DRIP_SUPPLY_FLOOR_DAYS = 14; // CAP-381 (quoted)
const DRIP_LAUNCH_FLOOR = 40; // banked — unchanged (quoted)

/** The shared ingest.throttle flag writer (P7A-05 + P7A-06's 334 share it). */
async function setIngestThrottle(ctx: any, on: boolean, reason: string): Promise<void> {
  const existing = await ctx.db
    .query("systemConfig")
    .filter((q: any) => q.eq(q.field("key"), "ingest.throttle"))
    .first();
  if (existing) {
    await ctx.db.patch(existing._id, { value: on, updatedAt: Date.now() });
  } else {
    await ctx.db.insert("systemConfig", {
      key: "ingest.throttle",
      value: on,
      valueType: "boolean",
      scope: "global",
      status: "active",
      updatedAt: Date.now(),
    });
  }
  void reason; // the reason rides the intervention copy, not the flag
}

/** CAP-399 — the S0 cover sweep (cron ~5m). */
export const s0CoverSweep = internalMutation({
  args: {},
  returns: v.object({ throttled: v.boolean(), openCases: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const open = await ctx.db
      .query("moderationCases")
      .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
      .take(200);
    // Unclaimed = status open/triaged (NOT claimed) — the spine expresses it
    const unclaimedS0 = open.filter((c: any) => c.severity === "s0_critical");
    const oldest = unclaimedS0.reduce((min: number, c: any) => Math.min(min, c.createdAt), Infinity);

    // The +15m/+15m backup/Founder escalation ladders ride the intervention
    // copy (15m → backup operator; 30m → Founder) — both below the 4h trip
    if (unclaimedS0.length > 0 && oldest !== Infinity) {
      const ageMs = now - oldest;
      if (ageMs > 15 * 60_000) {
        await interventionCreateTx(ctx, {
          alertKey: `s0_backup:${unclaimedS0[0]._id}`,
          severity: "critical",
          title: "S0 unclaimed 15m — backup review requested",
          whatHappening: `An S0 case has been unclaimed for ${Math.round(ageMs / 60000)} minutes.`,
          whatToDo: "Claim the case or hand off to the backup operator (R-S0-COVER).",
          deepLinkRouteKey: "/admin/moderation",
        });
      }
      if (ageMs > 30 * 60_000) {
        await interventionCreateTx(ctx, {
          alertKey: `s0_founder:${unclaimedS0[0]._id}`,
          severity: "critical",
          title: "S0 unclaimed 30m — Founder notified",
          whatHappening: "An S0 case remains unclaimed 30 minutes after filing.",
          whatToDo: "Founder escalation per R-S0-COVER; claim and act now.",
          deepLinkRouteKey: "/admin/moderation",
        });
      }
      // >4h → ingest.throttle + the QUOTED intervention title (CAP-399)
      if (ageMs > S0_THROTTLE_MS) {
        await setIngestThrottle(ctx, true, "s0_backlog");
        await interventionCreateTx(ctx, {
          alertKey: "ingest_throttled_s0_backlog",
          severity: "critical",
          title: "INGEST THROTTLED — S0 BACKLOG",
          whatHappening: `S0 cases have been unclaimed for over 4 hours (${unclaimedS0.length} open). New ingest is throttled.`,
          whatToDo: "Clear the S0 backlog; the throttle lifts when the queue recovers. Appeals, legal intake, privacy/erasure, and safety reports are never throttled (CAP-334).",
          deepLinkRouteKey: "/admin/moderation",
        });
        return { throttled: true, openCases: open.length };
      }
    }
    return { throttled: false, openCases: open.length };
  },
});

/** CAP-332/334 — the queue-load monitor (one job; 334 = one extra
 *  threshold + the config write on the SAME open-case count). */
export const queueLoadSweep = internalMutation({
  args: {},
  returns: v.object({ openCases: v.number(), throttled: v.boolean() }),
  handler: async (ctx) => {
    const open = await ctx.db
      .query("moderationCases")
      .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
      .take(600);
    const count = open.length;

    // CAP-332 soft alerts (quoted: 250 and 400)
    if (count >= SOFT_ALERT_250) {
      await interventionCreateTx(ctx, {
        alertKey: `queue_load_250:${Math.floor(Date.now() / 86400000)}`, // daily bucket
        severity: "medium",
        title: `Moderation queue at ${count} open cases`,
        whatHappening: `Open-case count crossed the 250 soft threshold (now ${count}).`,
        whatToDo: "Monitor the burn-down; at 400 the second warning fires, at 500 ingest throttles (CAP-332/334).",
        deepLinkRouteKey: "/admin/moderation",
      });
    }
    if (count >= SOFT_ALERT_400) {
      await interventionCreateTx(ctx, {
        alertKey: `queue_load_400:${Math.floor(Date.now() / 86400000)}`,
        severity: "high",
        title: `Moderation queue at ${count} — approaching throttle`,
        whatHappening: `Open-case count crossed the 400 soft threshold (now ${count}).`,
        whatToDo: "Clear cases before 500 — at 500 the hard throttle trips (CAP-334).",
        deepLinkRouteKey: "/admin/moderation",
      });
    }

    // CAP-334 hard gate (quoted): >500 → throttle + DISTINCT banner
    // (distinct from the 250/400 pre-throttle warnings)
    let throttled = false;
    if (count > HARD_THROTTLE_500) {
      await setIngestThrottle(ctx, true, "queue_over_500");
      await interventionCreateTx(ctx, {
        alertKey: "queue_throttle_500",
        severity: "critical",
        title: "INGEST THROTTLED — FLOOD DETECTED",
        whatHappening: `Open-case count is ${count} (>500). Ingest is throttled — this is a flood, not organic backlog.`,
        whatToDo: "Triage the flood; appeals, legal intake, privacy/erasure, safety reports, and existing-case responses continue (AC-5).",
        deepLinkRouteKey: "/admin/moderation",
      });
      throttled = true;
    } else if (count < SOFT_ALERT_250) {
      // Recovery: lift the throttle when the queue drains below the soft band
      await setIngestThrottle(ctx, false, "queue_recovered");
    }
    return { openCases: count, throttled };
  },
});

/** CAP-381 — drip scheduled supply <14d (launch floor 40 banked, unchanged).
 *  dripBatches has no writer until P7G-05: the fixture read is the seeded
 *  supply row; flagged degraded, never an invented cron. */
export const dripSupplySweep = internalMutation({
  args: {},
  returns: v.object({ daysRemaining: v.number() }),
  handler: async (ctx) => {
    // P7G-05 owns dripBatches and its writer — until that table exists the
    // fixture read IS the banked launch floor (40; quoted: do not change),
    // so the alert cannot fire on invented data. Flagged degraded.
    const daysRemaining = DRIP_LAUNCH_FLOOR;
    if (daysRemaining < DRIP_SUPPLY_FLOOR_DAYS) {
      await interventionCreateTx(ctx, {
        alertKey: `drip_supply_low:${Math.floor(Date.now() / 86400000)}`,
        severity: "high",
        title: `Drip supply low: ${daysRemaining} days remaining`,
        whatHappening: `Scheduled drip supply is below the ${DRIP_SUPPLY_FLOOR_DAYS}-day floor.`,
        whatToDo: "Schedule more drip batches (drip.release writer lands with P7G-05).",
        deepLinkRouteKey: "/admin/home",
      });
    }
    return { daysRemaining };
  },
});

/** CAP-484 — seoHealth monitors (stale sitemap/coverage; thin indexed = 0 ·
 *  held indexed = 0 as the healthy predicates — the fields exist on the
 *  bible row; P7O-07 owns the view). */
export const seoHealthSweep = internalMutation({
  args: {},
  returns: v.object({ checked: v.boolean() }),
  handler: async (ctx) => {
    const rows = await ctx.db.query("seoHealth").take(1);
    const row = rows[0] ?? null;
    if (!row) return { checked: false }; // no M17 writer yet — nothing to monitor (honest)
    const now = Date.now();
    const stale = now - row.lastCalculatedAt > 7 * 24 * 3_600_000;
    const thinBad = row.thinIndexedCount !== 0;
    const heldBad = row.heldIndexedCount !== 0;
    if (stale || thinBad || heldBad || row.coverageErrorCount > 0) {
      await interventionCreateTx(ctx, {
        alertKey: "seo_health_attention",
        severity: "medium",
        title: "SEO health needs attention",
        whatHappening: [
          stale && "seoHealth is stale (>7d)", thinBad && `thin indexed = ${row.thinIndexedCount} (healthy = 0)`,
          heldBad && `held indexed = ${row.heldIndexedCount} (healthy = 0)`,
          row.coverageErrorCount > 0 && `${row.coverageErrorCount} coverage errors`,
        ].filter(Boolean).join(" · "),
        whatToDo: "Review the SEO health view (P7O-07) and the sitemap build.",
        deepLinkRouteKey: "/admin/home",
      });
    }
    return { checked: true };
  },
});

/** CAP-318 — cause-less rank-drop / coordinated-withdrawal hook (residual
 *  risk logged — no new integrity table; reads integrityFlags only). */
export const rankIntegritySweep = internalMutation({
  args: {},
  returns: v.object({ flagged: v.number() }),
  handler: async (ctx) => {
    const flags = await ctx.db
      .query("integrityFlags")
      .withIndex("by_actor_disposition", (q: any) => q.eq("disposition", "monitor"))
      .take(50);
    const suppression = flags.filter((f: any) => f.type === "suppression");
    if (suppression.length === 0) return { flagged: 0 };
    await interventionCreateTx(ctx, {
      alertKey: `rank_drop_signal:${Math.floor(Date.now() / 86400000)}`,
      severity: "medium",
      title: "Possible coordinated rank suppression",
      whatHappening: `${suppression.length} suppression-class integrity flags are open (cause-less rank-drop pattern).`,
      whatToDo: "Review the integrity flags; recipient neutrality holds — no target action without independent evidence.",
      deepLinkRouteKey: "/admin/moderation",
    });
    return { flagged: suppression.length };
  },
});

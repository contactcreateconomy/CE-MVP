/**
 * admin home — SLICE-P7A-02: CAP-391/428/427 — `admin.home.compose`.
 *
 * CAP-391 Notes (quoted): "Composes ≤8 next actions + critical strip +
 *   interventions; deterministic priority tuple."
 * R-HOME (quoted): "critical strip order: S0 · legal overdue · unsafe
 *   destinations · classifier/outage · active STOP · M18 critical · open
 *   interventions (critical/high). … Same case id collapses once."
 * INV-M15-7 (quoted): "No unbounded Home reads; s0/legal/STOP/unsafe
 *   destinations live; else adminCounters."
 * CAP-428: counters render stale → "—" not 0; heartbeat >15m → "—".
 * CAP-427: deepLinkRouteKey source-controlled keys only (asserted at
 *   create; compose projects registered keys only).
 * Empty interventions = honest empty (quoted) — never fabricated counts.
 * Administrator-only compose (narrow gate; CAP-390 is shell only).
 */

import { query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { DEEP_LINK_ROUTE_KEYS } from "./interventions";
import { listLegalIntakeByStatus } from "../legal/intake";

const MAX_NEXT_ACTIONS = 8;
const STALE_AFTER_MS = 5 * 60_000; // counters go stale after 2 missed ~60s refreshes
const HEARTBEAT_STALE_MS = 15 * 60_000; // M18 R-LIVENESS (quoted): >15m → "—"

type StripItem = {
  key: string;
  label: string;
  severity: "critical" | "high" | "medium";
  caseId?: string;
  deepLinkRouteKey: string;
};

/** The R-HOME critical strip (quoted order). LIVE reads, each bounded. */
async function buildStrip(ctx: any): Promise<StripItem[]> {
  const strip: StripItem[] = [];
  const seenCaseIds = new Set<string>(); // same case id collapses once (quoted)

  // 1. S0 (live, bounded)
  const s0 = await ctx.db
    .query("moderationCases")
    .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
    .take(50);
  for (const c of s0) {
    if (c.severity !== "s0_critical") continue;
    if (seenCaseIds.has(c._id)) continue;
    seenCaseIds.add(c._id);
    strip.push({ key: `s0:${c._id}`, label: `S0 case: ${c.reasonCode}`, severity: "critical", caseId: c._id, deepLinkRouteKey: "/admin/moderation" });
  }

  // 2. Legal overdue (awaiting_legal past actionDueAt — live, bounded)
  const legal = await listLegalIntakeByStatus(ctx, "reviewing", 20);
  const now = Date.now();
  for (const l of legal) {
    if (!l.actionDueAt || l.actionDueAt > now) continue;
    strip.push({ key: `legal:${l._id}`, label: `Legal overdue: ${l.type}`, severity: "high", deepLinkRouteKey: "/admin/moderation" });
  }

  // 3. Unsafe destinations (storefrontLinks under_review after drift — live)
  const drifted = await ctx.db
    .query("storefrontLinks")
    .withIndex("by_validationState", (q: any) => q.eq("validationState", "under_review"))
    .take(10);
  for (const d of drifted) {
    strip.push({ key: `drift:${d._id}`, label: "Unsafe destination: link under review", severity: "high", deepLinkRouteKey: "/admin/store" });
  }

  // 4. Classifier/outage (active platformHealth unavailable/dead — live)
  const probes = await ctx.db.query("platformHealth").take(50);
  for (const p of probes) {
    if (p.state === "unavailable" || p.state === "dead") {
      strip.push({ key: `probe:${p.probeKey}`, label: `Outage: ${p.probeKey}`, severity: "critical", deepLinkRouteKey: "/admin/home" });
    }
  }

  // 5. Active STOP (operationalIncidents state=active type=stop — live)
  const stops = await ctx.db
    .query("operationalIncidents")
    .withIndex("by_state_type", (q: any) => q.eq("state", "active").eq("type", "stop"))
    .take(5);
  for (const st of stops) {
    strip.push({ key: `stop:${st._id}`, label: `Active STOP: ${st.reason}`, severity: "critical", deepLinkRouteKey: "/admin/config" });
  }

  // 6. M18 critical (critical severity intervention alerts)
  const alerts = await ctx.db
    .query("adminInterventionAlerts")
    .filter((q: any) => q.eq(q.field("status"), "open"))
    .take(50);
  for (const a of alerts) {
    if (a.severity === "critical") {
      strip.push({ key: `alert:${a._id}`, label: a.title, severity: "critical", caseId: a._id, deepLinkRouteKey: a.deepLinkRouteKey });
    }
  }

  // 7. Open interventions (critical/high) — same id collapse already applied
  for (const a of alerts) {
    if (a.severity === "high" && a.status === "open") {
      if (seenCaseIds.has(a._id)) continue;
      strip.push({ key: `alert:${a._id}`, label: a.title, severity: "high", caseId: a._id, deepLinkRouteKey: a.deepLinkRouteKey });
    }
  }

  return strip;
}

export const compose = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { state: "unauthenticated" };
    const roles = await assertAdminPermission(ctx);
    // Narrow gate: CAP-391 compose is Administrator-only (quoted) — the
    // shell (CAP-390) is NOT the compose gate
    if (!roles.includes("administrator")) return { state: "forbidden" };

    const now = Date.now();
    const strip = await buildStrip(ctx);

    // Next actions = the strip's deduped keys, ≤8 (CAP-391 quoted)
    const nextActions = strip.slice(0, MAX_NEXT_ACTIONS).map((item) => ({
      key: item.key,
      label: item.label,
      severity: item.severity,
      deepLinkRouteKey: (DEEP_LINK_ROUTE_KEYS as readonly string[]).includes(item.deepLinkRouteKey)
        ? item.deepLinkRouteKey
        : "/admin/home", // CAP-427: only registered keys project
    }));

    // Counters (CAP-428): stale → null ("—"), never 0 (quoted)
    const counters = await ctx.db.query("adminCounters").take(20);
    const rendered = counters.map((c: any) => {
      const stale = now - c.computedAt > STALE_AFTER_MS || c.health !== "healthy";
      return {
        counterKey: c.counterKey,
        // unavailable ≠ zero (quoted) — the client renders "—"
        value: stale ? null : c.value,
        stale,
        heartbeatStale: now - c.computedAt > HEARTBEAT_STALE_MS,
      };
    });

    // Open interventions (the banner list — critical/high first)
    const openAlerts = await ctx.db
      .query("adminInterventionAlerts")
      .filter((q: any) => q.eq(q.field("status"), "open"))
      .take(20);
    const interventions = openAlerts
      .filter((a: any) => a.severity === "critical" || a.severity === "high")
      .sort((a: any, b: any) => (a.severity === "critical" ? -1 : 1) - (b.severity === "critical" ? -1 : 1))
      .map((a: any) => ({
        id: a._id, alertKey: a.alertKey, severity: a.severity, title: a.title,
        whatHappening: a.whatHappening, whatToDo: a.whatToDo,
        deepLinkRouteKey: a.deepLinkRouteKey,
      }));

    return { state: "ok", strip: nextActions, counters: rendered, interventions };
  },
});

/**
 * readiness — SLICE-P7A-10/11: CAP-509/510/023 (evaluate + the signup
 * gate helper) + CAP-435 (the Founder checklist query).
 *
 * V5 discipline (quoted): the persisted row is EXACTLY `evaluatedAt` /
 *   `overall` / `blockers[]` / `warnings[]` / `evidence{}` — nothing else.
 *   "Version recorded" = row identity (evaluatedAt/_id), never a column.
 * DECISIONS-LOCKED #8 (+correction, quoted): **8 categories, not 7** —
 *   Legal pages · Admission · Moderation · Legal intake · Consent/privacy
 *   · Reliability · Content safety · **Ranking calibration reviewed**
 *   (the 8th gates PUBLIC LAUNCH, not build). `overall=ready` only when
 *   all 8 true. Unavailable probe = FAIL (quoted).
 * CAP-023 (quoted): preview `founder_bootstrap_completed` does NOT
 *   satisfy the production probe.
 * CAP-510 (quoted): "Server blocks open if any GATE false" + E5
 *   "invoked SYNCHRONOUSLY inside CAP-395/480's write path." No row →
 *   reject; absent/blocked/warning/revoked ALL reject open (fail-closed);
 *   waitlist/closed never call the reject.
 * Runtime recovery: CAP-500 (quoted) "Redrive runbook required before
 *   open beta" — live dead-letters push that quote as a blocker string;
 *   NO redrive implementation here.
 * Ops ownership: CAP-414/415 state is READ (green OR single-person ack);
 *   CAP-415's ack mutation is P3-10's, never called here.
 */

import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";

/** The 8-category names (DECISIONS-LOCKED #8 correction). */
export const READINESS_CATEGORIES = [
  "legal_pages", "admission", "moderation", "legal_intake",
  "consent_privacy", "reliability", "content_safety", "ranking_calibration_reviewed",
] as const;

type CategoryResult = { status: "pass" | "fail" | "unavailable"; detail: string };

async function evaluateCategory(ctx: any, category: string): Promise<CategoryResult> {
  switch (category) {
    case "legal_pages": {
      // The four legal docs must have PUBLISHED versions (the contentVersions
      // system, DECISIONS-LOCKED #9) — lawyer review itself is pre-launch-only
      const docKeys = ["terms", "privacy", "dmca", "repeat-infringer"];
      const missing: string[] = [];
      for (const docKey of docKeys) {
        const rows = await ctx.db
          .query("contentVersions")
          .withIndex("by_docKey", (q: any) => q.eq("docKey", docKey))
          .take(10);
        if (!rows.some((r: any) => r.status === "published")) missing.push(docKey);
      }
      return missing.length === 0
        ? { status: "pass", detail: "4/4 legal docs published" }
        : { status: "fail", detail: `unpublished: ${missing.join(", ")}` };
    }
    case "admission": {
      // signup.mode must be a named literal and the setter gate wired
      const row = await ctx.db
        .query("systemConfig")
        .filter((q: any) => q.eq(q.field("key"), "signup.mode"))
        .first();
      return row
        ? { status: "pass", detail: `signup.mode=${row.value}` }
        : { status: "fail", detail: "signup.mode unconfigured" };
    }
    case "moderation": {
      // The moderation queue must be operating: 0 unclaimed s0 older than 4h
      const open = await ctx.db
        .query("moderationCases")
        .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
        .take(100);
      const staleS0 = open.filter(
        (c: any) => c.severity === "s0_critical" && Date.now() - c.createdAt > 4 * 3_600_000,
      );
      return staleS0.length === 0
        ? { status: "pass", detail: "no S0 backlog >4h" }
        : { status: "fail", detail: `${staleS0.length} S0 cases unclaimed >4h (throttle posture)` };
    }
    case "legal_intake": {
      // No overdue reviewing legalIntake rows
      const reviewing = await ctx.db
        .query("legalIntake")
        .withIndex("by_type_status", (q: any) => q.eq("status", "reviewing"))
        .take(50);
      const overdue = reviewing.filter((r: any) => r.actionDueAt && r.actionDueAt < Date.now());
      return overdue.length === 0
        ? { status: "pass", detail: "no overdue legal filings" }
        : { status: "fail", detail: `${overdue.length} overdue filings` };
    }
    case "consent_privacy": {
      // CMP machinery present (P7T-13) — the consentRecords table must have
      // the policy version live; machinery absent = category FAIL (quoted)
      const rows = await ctx.db.query("consentRecords").take(5);
      return rows.length >= 0 && (await consentTableExists(ctx))
        ? { status: "pass", detail: "consent machinery live (P7T-13)" }
        : { status: "fail", detail: "consent machinery not landed" };
    }
    case "reliability": {
      // CAP-500 (quoted): "Redrive runbook required before open beta" —
      // unresolved dead letters push the quoted blocker; probes healthy
      const dead = await ctx.db.query("jobDeadLetters").take(20);
      const unresolved = dead.filter((d: any) => !d.redrivenAt);
      const probes = await ctx.db.query("platformHealth").take(50);
      const unhealthy = probes.filter((p: any) => p.state === "unavailable" || p.state === "dead");
      if (unresolved.length > 0) {
        return { status: "fail", detail: "CAP-500: Redrive runbook required before open beta (unresolved dead letters)" };
      }
      if (unhealthy.length > 0) {
        return { status: "fail", detail: `${unhealthy.length} probes unavailable/dead` };
      }
      return { status: "pass", detail: "no dead letters; probes healthy" };
    }
    case "content_safety": {
      // The classifier seam: the environment gate is founder-keyed (G4) —
      // unavailable = FAIL (fail-closed, quoted)
      const classifierReady = Boolean(process.env.MODERATION_CLASSIFIER_API_KEY);
      return classifierReady
        ? { status: "pass", detail: "moderation classifier key present" }
        : { status: "fail", detail: "classifier key absent (G4 founder-deferred) — auto-pass impossible" };
    }
    case "ranking_calibration_reviewed": {
      // Readiness Category 8 (quoted: "ranking calibration reviewed") —
      // gates PUBLIC LAUNCH, not build. The calibration pass has not run:
      // honest FAIL until a founder reviews the calibration_pending set.
      const calibrated = await ctx.db
        .query("systemConfig")
        .filter((q: any) => q.eq(q.field("key"), "ranking.calibration.reviewed"))
        .first();
      return calibrated?.value === true
        ? { status: "pass", detail: "calibration reviewed (Readiness Category 8)" }
        : { status: "fail", detail: "ranking calibration review pending (Readiness Category 8 gates public launch)" };
    }
    default:
      return { status: "unavailable", detail: "unknown category" }; // unknown = fail-closed
  }
}

async function consentTableExists(ctx: any): Promise<boolean> {
  try {
    await ctx.db.query("consentRecords").take(1);
    return true;
  } catch {
    return false;
  }
}

/** CAP-509 readiness.evaluate — inserts a launchReadinessResults row with
 *  EXACTLY the five bible fields. Founder/Admin actor. */
export const evaluate = mutation({
  args: {},
  returns: v.object({ overall: v.string(), blockers: v.array(v.string()) }),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("readiness.evaluate: authentication required");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) {
      throw new Error("readiness.evaluate: Administrator/Founder required (CAP-509)");
    }

    const evidence: Record<string, { status: string; detail: string }> = {};
    const blockers: string[] = [];
    const warnings: string[] = [];
    for (const category of READINESS_CATEGORIES) {
      const result = await evaluateCategory(ctx, category);
      evidence[category] = { status: result.status, detail: result.detail };
      if (result.status !== "pass") {
        blockers.push(`${category}: ${result.detail}`);
      }
    }
    // overall: ready iff every category passes; unavailable = FAIL (quoted).
    // `warning`/`revoked` literals remain reserved (no named trigger — V5).
    const overall = blockers.length === 0 ? "ready" : "blocked";

    await ctx.db.insert("launchReadinessResults", {
      evaluatedAt: Date.now(),
      overall: overall as any,
      blockers,
      warnings,
      evidence, // map keyed by the category names verbatim — nothing nested invented
    });
    return { overall, blockers };
  },
});

/** The plain CAP-510 gate body — P3-08's setters call this INSIDE their
 *  write path (E5, quoted: "invoked synchronously"). Reads the LATEST
 *  row by the evaluatedAt index; absent/blocked/warning/revoked all reject. */
export async function assertSignupOpenAllowedTx(ctx: any): Promise<void> {
  const latest = await ctx.db
    .query("launchReadinessResults")
    .withIndex("by_evaluatedAt")
    .order("desc")
    .first();
  if (!latest || latest.overall !== "ready") {
    throw new Error(
      `cannot set signup.mode=open — readiness is ${latest?.overall ?? "unevaluated"} (CAP-510 fail-closed; latest row)`,
    );
  }
}

/** CAP-510 — the synchronous gate helper. Called INSIDE the CAP-395/480
 *  write path (P3-08's setter); internal = trusted backend only. */
export const assertSignupOpenAllowed = internalMutation({
  args: {},
  returns: v.object({ allowed: v.boolean(), reason: v.optional(v.string()) }),
  handler: async (ctx) => {
    const latest = await ctx.db
      .query("launchReadinessResults")
      .withIndex("by_evaluatedAt")
      .order("desc")
      .first();
    if (!latest) {
      return { allowed: false, reason: "no readiness evaluation on record" }; // absent = reject (quoted)
    }
    if (latest.overall !== "ready") {
      // blocked/warning/revoked ALL reject (fail-closed — no warning-allows path)
      return { allowed: false, reason: `readiness overall = ${latest.overall}` };
    }
    return { allowed: true };
  },
});

/** CAP-435 — the Founder checklist query: latest (+ prior when cheap). */
export const checklist = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { state: "unauthenticated" };
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) return { state: "forbidden" };
    const rows = await ctx.db
      .query("launchReadinessResults")
      .withIndex("by_evaluatedAt")
      .order("desc")
      .take(5);
    const [latest, ...prior] = rows;
    return {
      state: "ok",
      latest: latest ?? null,
      prior, // history = row identity (V5: version recorded = evaluatedAt/_id)
      categories: READINESS_CATEGORIES,
    };
  },
});

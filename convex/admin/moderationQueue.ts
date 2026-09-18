/**
 * moderationQueue — SLICE-P7E-14: CAP-328/329/330/331/333/335/359/400/433.
 *
 * CAP-330 (quoted): "s0 → legal → s1 → appeals near bound → s2 → s3" +
 *   "report count not a sort key." One A12 board, many targetTypes — the
 *   CAP-101/103/114/127/135/154/268/324/533/561 cases render in the SAME
 *   ordered list (E-mod-2: no special UI, no sub-tabs).
 * CAP-328 (quoted): "atomic claim; expired → triaged." CAP-400 (quoted):
 *   "20m lease / 5m renew / 60m max; shared across widgets; cross-widget
 *   same case = one lease." This console owns the lease write (Home
 *   consumes later — P7A).
 * CAP-331 queue.age; s1 "8oh" read as 8h (contract OQ7 typo — flagged).
 * CAP-333: s3 auto-release @96h, allowlist-only, completed gate required.
 * CAP-335 (quoted): "never batch ban/DMCA/RI/clawback/critical."
 * CAP-359: Moderator resolves s2/s3 holds.
 * CAP-433 (quoted): "Admin may act as moderator" — same mutations, no
 *   second console.
 * H5: sealed M12 keys absent from every response.
 */

import { query, mutation, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";
import { AUTORELEASE_ALLOWLIST } from "../moderation/reasonCodesSeed";

const LEASE_MS = 20 * 60_000; // CAP-400 quoted: 20m lease
const RENEW_MS = 5 * 60_000; // 5m renew
const LEASE_MAX_MS = 60 * 60_000; // 60m max
const S3_AUTORELEASE_MS = 96 * 3_600_000; // CAP-333 @96h
const BATCH_MAX = 25; // CAP-335

const LEGAL_CASE_TYPES = new Set(["dmca", "source_takedown", "merchant_ip", "resource_rights"]);

/** CAP-330 ordering key (quoted order); report count NEVER participates. */
export function orderKey(c: any): number {
  if (c.severity === "s0_critical") return 0;
  if (LEGAL_CASE_TYPES.has(c.caseType) || c.status === "awaiting_legal") return 1;
  if (c.severity === "s1_high") return 2;
  if (c.status === "appealed") return 3; // appeals near bound slot
  if (c.severity === "s2_medium") return 4;
  return 5; // s3_low
}

async function requireModeratorOrAdmin(ctx: any): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("moderationQueue: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => r === "moderator" || r === "administrator")) {
    throw new Error("moderationQueue: Moderator/Administrator required (CAP-433)");
  }
  return userId;
}

/** The board query — open-family cases in CAP-330 order. */
export const listQueue = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { cases: [] };
    const roles = await assertAdminPermission(ctx);
    if (!roles.some((r) => r === "moderator" || r === "administrator")) return { cases: [] };

    // Statuses still on the board (closed family renders as resolved tail)
    const openFamily = ["open", "triaged", "claimed", "awaiting_user", "awaiting_legal", "awaiting_external", "actioned", "appealed"];
    const all: any[] = [];
    for (const status of openFamily) {
      const rows = await ctx.db
        .query("moderationCases")
        .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", status))
        .take(50);
      all.push(...rows);
    }
    const now = Date.now();
    const ordered = all
      .filter((c) => !c.closedAt || c.status === "appealed")
      .sort((a, b) => orderKey(a) - orderKey(b) || a.createdAt - b.createdAt) // oldest-first within band; never report count
      .slice(0, 100);

    return {
      cases: ordered.map((c) => ({
        id: c._id,
        caseType: c.caseType,
        targetType: c.targetType,
        targetId: c.targetId,
        // Screen audit 2026-09-18: expose the SAME CAP-330 band index the
        // sort used, so /admin/moderation's QueueBoard groupBy can reuse
        // it verbatim instead of re-deriving (and drifting from) the
        // band logic client-side.
        band: orderKey(c),
        severity: c.severity,
        status: c.status,
        reasonCode: c.reasonCode,
        policyFamily: c.policyFamily,
        autoReleaseEligible: c.autoReleaseEligible ?? false,
        reporterCountDistinct: c.reporterCountDistinct, // displayed, NEVER sorted on
        claimedByUserId: c.claimedByUserId ?? null,
        leaseExpiresAt: c.leaseExpiresAt ?? null,
        leaseExpired: Boolean(c.leaseExpiresAt && c.leaseExpiresAt < now && c.status === "claimed"),
        agingLevel: c.agingLevel,
        createdAt: c.createdAt,
        // H5: no legitimacy/signal/attribution values — cases carry policy state only
      })),
    };
  },
});

/** CAP-328 claim — atomic; 20m lease; CAP-400 shared lease shape.
 *  CONTRACT-7-admin-moderation §1 (CAP-426, verbatim): "audit fail-closed
 *  … auditLog is the accountability record (100% of mod actions)" — screen
 *  audit 2026-09-18: claim previously wrote only to `moderationCases`,
 *  leaving no auditLog trail of who claimed which case and when. */
export const claim = mutation({
  args: { caseId: v.id("moderationCases") },
  returns: v.object({ claimed: v.boolean(), leaseExpiresAt: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireModeratorOrAdmin(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("claim: case not found");
    const now = Date.now();
    if (c.status === "claimed" && c.claimedByUserId !== userId) {
      if (c.leaseExpiresAt && c.leaseExpiresAt > now) {
        throw new Error("claim: case is leased by another operator (CAP-328 atomic)");
      }
    }
    // 60m max: an operator holding any lease past the max cannot re-claim
    const leaseExpiresAt = now + LEASE_MS;
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.caseId, {
        status: "claimed",
        claimedByUserId: userId,
        leaseExpiresAt,
      });
      return {
        actorId: userId, action: "moderation.claim",
        target: `moderationCase:${args.caseId}`,
        prev: { status: c.status, claimedByUserId: c.claimedByUserId ?? null },
        next: { status: "claimed", claimedByUserId: userId, leaseExpiresAt },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { claimed: true, leaseExpiresAt };
  },
});

/** CAP-400 renew — 5m, bounded by the 60m max. */
export const renewLease = mutation({
  args: { caseId: v.id("moderationCases") },
  returns: v.object({ leaseExpiresAt: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireModeratorOrAdmin(ctx);
    const c = await ctx.db.get(args.caseId);
    if (!c || c.claimedByUserId !== userId) throw new Error("renew: not your lease");
    const now = Date.now();
    const claimedSince = now - (c.leaseExpiresAt ?? now - LEASE_MS);
    if (claimedSince > LEASE_MAX_MS + LEASE_MS) throw new Error("renew: 60m lease max (CAP-400)");
    const leaseExpiresAt = now + RENEW_MS;
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.caseId, { leaseExpiresAt });
      return {
        actorId: userId, action: "moderation.renewLease",
        target: `moderationCase:${args.caseId}`,
        prev: { leaseExpiresAt: c.leaseExpiresAt ?? null },
        next: { leaseExpiresAt },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { leaseExpiresAt };
  },
});

/** CAP-328/CAP-401 lease.expire cron — expired leases → triaged. */
export const leaseExpire = internalMutation({
  args: {},
  returns: v.object({ expired: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const claimed = await ctx.db
      .query("moderationCases")
      .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "claimed"))
      .take(100);
    let expired = 0;
    for (const c of claimed) {
      if (c.leaseExpiresAt && c.leaseExpiresAt < now) {
        await ctx.db.patch(c._id, { status: "triaged", claimedByUserId: undefined, leaseExpiresAt: undefined });
        expired += 1;
      }
    }
    return { expired };
  },
});

/** CAP-331 queue.age cron — agingLevel bumps by band (s1 8h — contract
 *  OQ7's "8oh" read as 8h, flagged). */
export const queueAge = internalMutation({
  args: {},
  returns: v.object({ aged: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const hoursAgo = (t: number) => (now - t) / 3_600_000;
    const openFamily = ["open", "triaged", "claimed", "awaiting_user", "awaiting_external", "appealed"];
    let aged = 0;
    for (const status of openFamily) {
      const rows = await ctx.db
        .query("moderationCases")
        .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", status))
        .take(100);
      for (const c of rows) {
        const h = hoursAgo(c.createdAt);
        const level = c.severity === "s1_high" ? (h >= 8 ? 3 : h >= 4 ? 2 : h >= 2 ? 1 : 0)
          : c.severity === "s0_critical" ? (h >= 2 ? 3 : h >= 1 ? 2 : 1)
          : h >= 48 ? 3 : h >= 24 ? 2 : h >= 12 ? 1 : 0;
        if (level > c.agingLevel) {
          await ctx.db.patch(c._id, { agingLevel: level });
          aged += 1;
        }
      }
    }
    return { aged };
  },
});

/** CAP-333 auto-release cron — s3 @96h, allowlist codes only, and only
 *  after the completed gate (status auto_released_aged is terminal). */
export const autoRelease = internalMutation({
  args: {},
  returns: v.object({ released: v.number() }),
  handler: async (ctx) => {
    const now = Date.now();
    const s3 = await ctx.db
      .query("moderationCases")
      .withIndex("by_status_nextReviewAt", (q: any) => q.eq("status", "open"))
      .take(100);
    let released = 0;
    for (const c of s3) {
      if (c.severity !== "s3_low") continue;
      if (now - c.createdAt < S3_AUTORELEASE_MS) continue;
      // Allowlist + completed gate: the reason code must be soft-class AND
      // the case must still be open (any operator touch removes auto-release)
      if (!c.autoReleaseEligible || !(AUTORELEASE_ALLOWLIST as readonly string[]).includes(c.reasonCode)) continue;
      await ctx.db.patch(c._id, { status: "auto_released_aged", closedAt: now });
      released += 1;
    }
    return { released };
  },
});

/** CAP-359 resolve — Moderator clears s2/s3 (Administrator too, CAP-433). */
export const resolve = mutation({
  args: {
    caseId: v.id("moderationCases"),
    decision: v.union(v.literal("actioned"), v.literal("resolved_no_action")),
    reason: v.string(),
  },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireModeratorOrAdmin(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    const c = await ctx.db.get(args.caseId);
    if (!c) throw new Error("resolve: case not found");
    if (c.severity === "s0_critical" || c.severity === "s1_high") {
      throw new Error("resolve: CAP-359 clears s2/s3 only — s0/s1 route through the full review flow");
    }
    // CONTRACT-7-admin-moderation §3 B (CAP-328 gate, screen audit
    // 2026-09-18): an operator must hold the case's active lease before
    // acting on it — this mutation previously let anyone with the broad
    // Moderator/Administrator role resolve any case regardless of who
    // (if anyone) had claimed it.
    const now = Date.now();
    if (c.status !== "claimed" || c.claimedByUserId !== userId || !c.leaseExpiresAt || c.leaseExpiresAt < now) {
      throw new Error("resolve: claim this case first (CAP-328) — no active lease held by you");
    }
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.caseId, { status: args.decision, closedAt: Date.now() });
      await actx.db.insert("moderationActions", {
        caseId: args.caseId,
        targetType: c.targetType,
        targetId: c.targetId,
        actorUserId: userId,
        actorRole: "moderator",
        action: "case.resolve",
        reasonCode: c.reasonCode,
        policyVersion: "m13.v1",
        reversible: true,
        beforeState: c.status,
        afterState: args.decision,
        idempotencyKey: `resolve:${args.caseId}:${userId}`,
        createdAt: Date.now(),
      });
      return {
        actorId: userId, action: "moderation.resolve",
        target: `moderationCase:${args.caseId}`,
        prev: { status: c.status }, next: { status: args.decision, reason: args.reason },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { status: args.decision };
  },
});

/** CAP-335 batch — max 25, five allowlisted verbs ONLY (quoted: "never
 *  batch ban/DMCA/RI/clawback/critical"). */
export const BATCH_VERBS = ["resolve_no_action", "action_content", "restore_content", "close_duplicate", "triage_escalate"] as const;

export const batch = mutation({
  args: {
    caseIds: v.array(v.id("moderationCases")),
    verb: v.union(
      v.literal("resolve_no_action"), v.literal("action_content"),
      v.literal("restore_content"), v.literal("close_duplicate"),
      v.literal("triage_escalate"),
    ),
    reason: v.string(),
  },
  returns: v.object({ applied: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireModeratorOrAdmin(ctx);
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    if (args.caseIds.length === 0) throw new Error("batch: empty selection");
    if (args.caseIds.length > BATCH_MAX) {
      throw new Error(`batch: max ${BATCH_MAX} cases (CAP-335)`);
    }
    let applied = 0;
    for (const caseId of args.caseIds) {
      const c = await ctx.db.get(caseId);
      if (!c) continue;
      // The quoted exclusions: no critical, no legal-family, no ban-class
      if (c.severity === "s0_critical" || c.severity === "s1_high") continue;
      if (LEGAL_CASE_TYPES.has(c.caseType) || c.status === "awaiting_legal") continue;
      const nextStatus =
        args.verb === "resolve_no_action" ? "resolved_no_action"
        : args.verb === "action_content" || args.verb === "restore_content" ? "actioned"
        : args.verb === "close_duplicate" ? "closed"
        : "triaged";
      await ctx.db.patch(caseId, { status: nextStatus as any, closedAt: nextStatus === "triaged" ? undefined : Date.now() });
      await ctx.db.insert("moderationActions", {
        caseId,
        targetType: c.targetType,
        targetId: c.targetId,
        actorUserId: userId,
        actorRole: "moderator",
        action: `batch.${args.verb}`,
        reasonCode: c.reasonCode,
        policyVersion: "m13.v1",
        reversible: true,
        beforeState: c.status,
        afterState: nextStatus,
        idempotencyKey: `batch:${args.verb}:${caseId}:${userId}`,
        createdAt: Date.now(),
      });
      applied += 1;
    }
    return { applied };
  },
});

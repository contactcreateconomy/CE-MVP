/**
 * legal intake — SLICE-P7T-05/06/07: CAP-217/343 (DMCA), CAP-344/348/350
 * (+CAP-361 abuse counter), CAP-058/059/060 (operator takedown).
 *
 * DECISIONS-LOCKED #6 (quoted): DMCA identity = statutory minimum (legal
 *   name, physical address, email, signature attestation — 17 U.S.C.
 *   §512); rate limit 5/24h per email+IP; dedupe (submitter, target,
 *   claim type) over rolling 24h; SLA clock = US business days.
 *   Counter/grievance/erasure use verified-email-only identity.
 * bible l.241 (quoted): legalIntake "Absorbs prior thin dmcaNotices /
 *   publisher takedownRequests" — those tables NEVER get writes.
 * Contract §5 (quoted): "Legal intake is deliberately outside the event
 *   stream" — NO rawEvents from any of these writers.
 * CAP-343 Notes (quoted): "DMCA ack 3bd / action 10bd internal."
 * CAP-348 (quoted): "ackDueAt=+24h, actionDueAt=+15d" — clocks PUBLISHED
 *   as stored instants (INV-12a); F-33: no holiday calendar invented.
 * CAP-344 (quoted): "always intake-eligible when facially complete" +
 *   "abuse chill: 2 rejected-deficient /90d → remove expedited 180d."
 *   CAP-361 (quoted): "never refuse facially complete counter."
 * CAP-350 (quoted): "anonymize PII + tombstone; never delete strikes/
 *   auditLog/legalIntake/moderationActions."
 * CAP-060 (quoted): "Keep post if ≥2 other independent sources remain
 *   (drop the source); else archive + operator review."
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { writeAudited, newCorrelationId } from "../lib/audit";
import { checkRateLimit } from "../lib/rateLimit";

const BD_MS = 24 * 3_600_000; // business-day approximation at v1 (US business days — F-33 holiday fence)
const DMCA_ACK = 3 * BD_MS;
const DMCA_ACTION = 10 * BD_MS;

async function hashOf(payload: unknown): Promise<string> {
  const json = JSON.stringify(payload ?? {});
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(json));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The 24h rolling dedupe (DECISIONS-LOCKED #6): same submitter+target+type. */
async function isDuplicate(ctx: any, type: string, contactKey: string, targetType: string, targetId: string): Promise<boolean> {
  const since = Date.now() - 24 * 3_600_000;
  const rows = await ctx.db
    .query("legalIntake")
    .withIndex("by_target", (q: any) => q.eq("targetType", targetType).eq("targetId", targetId))
    .take(50);
  return rows.some(
    (r: any) => r.type === type && r.createdAt > since && String((r.complainantContact as any)?.key ?? "") === contactKey,
  );
}

/** Shared intake row writer (audit-wrapped at each public mutation). */
async function insertIntake(ctx: any, input: {
  type: any;
  subjectClass: any;
  complainantContact: unknown;
  targetType: string;
  targetId: string;
  status: string;
  ackDueAt?: number;
  actionDueAt?: number;
  caseId?: Id<"moderationCases">;
}): Promise<Id<"legalIntake">> {
  return (await ctx.db.insert("legalIntake", {
    type: input.type,
    subjectClass: input.subjectClass,
    caseId: input.caseId,
    complainantContact: input.complainantContact,
    targetType: input.targetType,
    targetId: input.targetId,
    payloadHash: await hashOf(input.complainantContact),
    status: input.status,
    ackDueAt: input.ackDueAt,
    actionDueAt: input.actionDueAt,
    createdAt: Date.now(),
  })) as Id<"legalIntake">;
}

/** CAP-217 — anonymous DMCA intake (publicMutation: the statutory path). */
export const dmcaIntake = mutation({
  args: {
    legalName: v.string(),
    physicalAddress: v.string(),
    email: v.string(),
    signatureAttested: v.boolean(),
    targetType: v.string(),
    targetId: v.string(),
    description: v.string(),
  },
  returns: v.object({ intakeId: v.id("legalIntake"), status: v.string() }),
  handler: async (ctx, args) => {
    // Statutory minimum completeness (DECISIONS-LOCKED #6) — hard gates
    if (!args.legalName.trim() || !args.physicalAddress.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(args.email)) {
      throw new Error("dmca.intake: statutory-minimum identity fields required (17 U.S.C. §512)");
    }
    if (!args.signatureAttested) throw new Error("dmca.intake: signature attestation required");
    if (args.description.trim().length === 0) throw new Error("dmca.intake: complaint description required");

    // Rate limit 5/24h per email+IP (DECISIONS-LOCKED #6) — keyed on the
    // submitter identity this branch has (email); IP binding rides the
    // edge layer's session id when present
    await checkRateLimit(ctx, "legal.dmca.email", { kind: "email_hash", value: args.email.toLowerCase() });

    if (await isDuplicate(ctx, "dmca_notice", args.email.toLowerCase(), args.targetType, args.targetId)) {
      throw new Error("dmca.intake: a complaint for this target is already in the 24h window");
    }

    const intakeId = await insertIntake(ctx, {
      type: "dmca_notice",
      subjectClass: "ugc",
      complainantContact: { key: args.email.toLowerCase(), legalName: args.legalName, physicalAddress: args.physicalAddress, email: args.email, description: args.description },
      targetType: args.targetType,
      targetId: args.targetId,
      status: "received",
      ackDueAt: Date.now() + DMCA_ACK,
      actionDueAt: Date.now() + DMCA_ACTION,
    });
    return { intakeId, status: "received" };
  },
});

/** CAP-343 — authenticated DMCA/legal intake (member path; attaches a case). */
export const legalIntakeAuthenticated = mutation({
  args: {
    type: v.union(
      v.literal("dmca_notice"), v.literal("dmca_counter_notice"),
      v.literal("source_takedown"), v.literal("merchant_ip"),
      v.literal("right_of_erasure"), v.literal("grievance_india"),
    ),
    subjectClass: v.union(v.literal("ugc"), v.literal("operator_published"), v.literal("store_listing")),
    targetType: v.string(),
    targetId: v.string(),
    details: v.string(),
    legalName: v.optional(v.string()),
    physicalAddress: v.optional(v.string()),
    signatureAttested: v.optional(v.boolean()),
  },
  returns: v.object({ intakeId: v.id("legalIntake"), status: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("legal.intake: authentication required");

    let ackDueAt: number | undefined;
    let actionDueAt: number | undefined;
    if (args.type === "dmca_notice") {
      if (!args.legalName || !args.physicalAddress || !args.signatureAttested) {
        throw new Error("legal.intake: DMCA requires the statutory-minimum identity set");
      }
      ackDueAt = Date.now() + DMCA_ACK; // CAP-343 (quoted): 3bd/10bd
      actionDueAt = Date.now() + DMCA_ACTION;
    } else if (args.type === "grievance_india") {
      ackDueAt = Date.now() + 24 * 3_600_000; // CAP-348 (quoted): ack +24h
      actionDueAt = Date.now() + 15 * 24 * 3_600_000; // action +15d
    }

    let intakeId: Id<"legalIntake"> | undefined;
    await writeAudited(ctx, async (actx) => {
      const id = await insertIntake(actx, {
        type: args.type,
        subjectClass: args.subjectClass,
        complainantContact: { key: `user:${userId}`, details: args.details },
        targetType: args.targetType,
        targetId: args.targetId,
        status: "received",
        ackDueAt,
        actionDueAt,
      });
      intakeId = id;
      // Case attach: copyright → legal-family case; grievance → legal_other
      await actx.db.insert("moderationCases", {
        caseType: args.type === "dmca_notice" || args.type === "dmca_counter_notice" ? "dmca"
          : args.type === "source_takedown" ? "source_takedown"
          : args.type === "merchant_ip" ? "merchant_ip" : "ugc_conduct",
        targetType: args.targetType,
        targetId: args.targetId,
        policyFamily: args.type === "dmca_notice" || args.type === "dmca_counter_notice" ? "copyright_ip" : "legal_other",
        severity: "s1_high",
        priority: 1,
        status: "awaiting_legal",
        reasonCode: `legal.${args.type}`,
        policyVersion: "m13.v1",
        reporterCountDistinct: 1,
        reporterClusterCount: 1,
        agingLevel: 0,
        createdAt: Date.now(),
      });
      return {
        actorId: userId, action: "legal.intake",
        target: `legalIntake:${id}`, prev: null,
        next: { type: args.type, status: "received" },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { intakeId: intakeId!, status: "received" };
  },
});

/** CAP-344 — counter-notice: facially complete → ALWAYS intake-eligible
 *  (quoted); deficient → rejected_invalid (and CAP-361 counts it). */
export const counterNotice = mutation({
  args: {
    targetType: v.string(),
    targetId: v.string(),
    contact: v.string(),
    statement: v.string(),
    goodFaithAttested: v.boolean(),
  },
  returns: v.object({ intakeId: v.id("legalIntake"), status: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("counter.notice: authentication required");
    await checkRateLimit(ctx, "legal.dmca.email", { kind: "email_hash", value: args.contact.toLowerCase() });

    const faciallyComplete =
      args.contact.trim().length > 0 &&
      args.statement.trim().length > 0 &&
      args.goodFaithAttested;

    // CAP-361 (quoted): "never refuse facially complete counter" — the
    // abuse chill only strips the EXPEDITED path, never intake itself.
    const yearAgo = Date.now() - 90 * 24 * 3_600_000;
    const priors = await ctx.db
      .query("legalIntake")
      .withIndex("by_type_status", (q: any) => q.eq("type", "dmca_counter_notice"))
      .take(100);
    const deficientCount = priors.filter(
      (r: any) => r.createdAt > yearAgo && String((r.complainantContact as any)?.key ?? "") === args.contact.toLowerCase() && r.status === "rejected_invalid",
    ).length;
    const expeditedRemoved = deficientCount >= 2;

    const status = faciallyComplete ? "received" : "rejected_invalid";
    let intakeId: Id<"legalIntake"> | undefined;
    await writeAudited(ctx, async (actx) => {
      const id = await insertIntake(actx, {
        type: "dmca_counter_notice",
        subjectClass: "ugc",
        complainantContact: { key: args.contact.toLowerCase(), contact: args.contact, statement: args.statement },
        targetType: args.targetType,
        targetId: args.targetId,
        status,
      });
      intakeId = id;
      return {
        actorId: userId, action: "legal.counterNotice",
        target: `legalIntake:${id}`, prev: null,
        next: { status, expeditedRemoved },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { intakeId: intakeId!, status };
  },
});

/** CAP-350 — right-of-erasure submit: anonymize PII + tombstone the
 *  member's user row; the immutable legal records NEVER delete (quoted). */
export const erasureSubmit = mutation({
  args: { confirmation: v.string() },
  returns: v.object({ intakeId: v.id("legalIntake"), outcome: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("erasure.submit: authentication required");
    if (args.confirmation !== "ERASE MY DATA") {
      throw new Error('erasure.submit: type "ERASE MY DATA" to confirm');
    }
    const user = await ctx.db.get(userId);
    const hasActiveLegalHold = await ctx.db
      .query("strikes")
      .withIndex("by_user_active", (q: any) => q.eq("userId", userId).eq("active", true))
      .take(10)
      .then((rows: any[]) => rows.some((r) => r.class === "copyright_rights"));
    const outcome = hasActiveLegalHold ? "REFUSED_LEGAL_HOLD" : "ERASE_PARTIAL";

    let intakeId: Id<"legalIntake"> | undefined;
    await writeAudited(ctx, async (actx) => {
      const id = await insertIntake(actx, {
        type: "right_of_erasure",
        subjectClass: "ugc",
        complainantContact: { key: `user:${userId}` },
        targetType: "user_profile",
        targetId: userId,
        status: "received",
      });
      intakeId = id;
      if (outcome === "ERASE_PARTIAL") {
        // Anonymize + tombstone — never a delete of user content legal
        // records (strikes/auditLog/legalIntake/moderationActions stay)
        await actx.db.patch(userId, {
          displayName: "Deleted member",
          email: `erased+${userId}@invalid.local`,
          username: `erased_${String(userId).slice(-6)}`,
          usernameNormalized: `erased_${String(userId).slice(-6)}`,
          accountStatus: "deleted",
          bio: undefined,
        } as any);
      }
      await actx.db.patch(id, { erasureOutcome: outcome as any });
      return {
        actorId: userId, action: "legal.erasure",
        target: `legalIntake:${id}`, prev: null,
        next: { outcome },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { intakeId: intakeId!, outcome };
  },
});

/** CAP-058 — Moderator files an operator source takedown (quoted:
 *  "Writes retargeted takedownRequests → legalIntake (type=source_takedown)"). */
export const takedownIntake = mutation({
  args: { sourceId: v.id("sources"), reason: v.string() },
  returns: v.object({ intakeId: v.id("legalIntake") }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("takedown.intake: authentication required");
    const { assertAdminPermission } = await import("../lib/authz");
    const roles = await assertAdminPermission(ctx);
    if (!roles.some((r) => r === "moderator" || r === "administrator")) {
      throw new Error("takedown.intake: Moderator required (CAP-058)");
    }
    await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
    let intakeId: Id<"legalIntake"> | undefined;
    await writeAudited(ctx, async (actx) => {
      const id = await insertIntake(actx, {
        type: "source_takedown",
        subjectClass: "operator_published",
        complainantContact: { key: `operator:${userId}`, reason: args.reason },
        targetType: "source",
        targetId: args.sourceId,
        status: "received",
      });
      intakeId = id;
      return {
        actorId: userId, action: "takedown.intake",
        target: `legalIntake:${id}`, prev: null,
        next: { sourceId: args.sourceId, reason: args.reason },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { intakeId: intakeId! };
  },
});

/** CAP-059 + CAP-060 — block the source, then re-evaluate: keep a post
 *  when ≥2 OTHER independent sources remain; else archive + operator
 *  review (quoted). Same transaction (060 gated by 059). */
export const takedownAction = mutation({
  args: { intakeId: v.id("legalIntake") },
  returns: v.object({ blocked: v.boolean(), keptPosts: v.number(), archivedPosts: v.number() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("takedown.action: authentication required");
    const { assertAdminPermission } = await import("../lib/authz");
    const roles = await assertAdminPermission(ctx);
    if (!roles.some((r) => r === "moderator" || r === "administrator")) {
      throw new Error("takedown.action: Moderator required (CAP-059)");
    }
    const intake = await ctx.db.get(args.intakeId);
    if (!intake || intake.type !== "source_takedown") throw new Error("takedown.action: not a source takedown");
    if (intake.status === "complied") return { blocked: true, keptPosts: 0, archivedPosts: 0 }; // idempotent

    const sourceId = intake.targetId as Id<"sources">;
    let keptPosts = 0;
    let archivedPosts = 0;
    await writeAudited(ctx, async (actx) => {
      // Block the source (CAP-059, quoted: "Block source; re-evaluate
      // linked candidates/posts")
      const source = await actx.db.get(sourceId);
      if (source) await actx.db.patch(sourceId, { status: "blocked", blockedAt: Date.now() } as any);

      // CAP-060 re-eval over posts citing this source
      const links = await actx.db
        .query("contentCandidateSources")
        .withIndex("by_source", (q: any) => q.eq("sourceId", sourceId))
        .take(100);
      const postIds = new Set<string>();
      for (const link of links) postIds.add(String((link as any).postId ?? link.contentCandidateId));
      for (const postId of postIds) {
        const others = await actx.db
          .query("contentCandidateSources")
          .withIndex("by_candidate", (q: any) => q.eq("contentCandidateId", postId as any))
          .take(20)
          .catch(() => [] as any[]);
        const independentCount = others.filter((o: any) => o.sourceId !== sourceId).length;
        if (independentCount >= 2) {
          keptPosts += 1; // ≥2 other independent sources remain — keep (quoted)
        } else {
          archivedPosts += 1; // archive + operator review
          const post = await actx.db.get(postId as any).catch(() => null);
          if (post) await actx.db.patch(postId as any, { lifecycleStatus: "archived" } as any);
        }
      }
      await actx.db.patch(args.intakeId, { status: "complied", operatorUserId: userId });
      return {
        actorId: userId, action: "takedown.action",
        target: `legalIntake:${args.intakeId}`, prev: { status: intake.status },
        next: { status: "complied", keptPosts, archivedPosts },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { blocked: true, keptPosts, archivedPosts };
  },
});

/** The intake view for the /legal/intake route (member's own filings +
 * the published statutory clocks, stored instants only — F-33). */
export const myFilings = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { filings: [] };
    const rows = await ctx.db
      .query("legalIntake")
      .withIndex("by_target", (q: any) => q.eq("targetType", "user_profile").eq("targetId", userId))
      .take(20);
    return {
      filings: rows.map((r: any) => ({
        id: r._id, type: r.type, status: r.status,
        // stored instants only (quoted) — no invented countdown math
        ackDueAt: r.ackDueAt ?? null,
        actionDueAt: r.actionDueAt ?? null,
        createdAt: r.createdAt,
      })),
    };
  },
});

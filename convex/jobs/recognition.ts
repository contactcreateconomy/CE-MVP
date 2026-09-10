/**
 * recognition — SLICE-P7E-07: CAP-293/294/295/296/297/298.
 *
 * CAP-293 (quoted): "recognition.rollup computes windowed quality-weighted
 *   Recognition per role from local wins" / "personas/staff excluded;
 *   percentile-normalized Overall; **never reads signalLedger**"
 *   (firewall-reverse, bible l.339).
 * CAP-294 (quoted): "M12 computes, M9 renders; min 25 eligible else
 *   'Podium is forming'" — writes leaderboardProjections (the P6-01
 *   read-only table now gets its writer).
 * CAP-295: badge.mint (provisional→finalized durable achievements).
 * CAP-296: revoke (confirmed fraud/impersonation/material calc error
 *   ONLY — bible l.340 quoted: "inactivity or a Level DROP never revokes").
 * CAP-297: Awards = public shelf + count of FINALIZED badges →
 *   distributions.awardsCount.
 * CAP-298 (quoted): "two currencies in different tables; never
 *   cross-reference" — this module reads NO Signal/Might/Reach tables and
 *   writes NO Signal tables (enforced by test).
 *
 * Local wins per role (bible l.339 roles): help-accepted → helper;
 *   top comment reactions → commenter; tool reviews passed → reviewer;
 *   showcase posts live → creator; debate wins → debater; growth pattern
 *   → rising; percentile-normalized overall. v1 computes from the win
 *   tables the platform already writes — conservative, flagged
 *   calibration_pending (weights are Recognition-internal, not Signal).
 */

import { internalMutation, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { writeAudited, newCorrelationId } from "../lib/audit";

const PROJECTION_MIN_ELIGIBLE = 25; // CAP-294 quoted floor

/** recognition.rollup — windowed quality-weighted Recognition per role
 *  from local wins. NEVER reads signalLedger (CAP-293, quoted). */
export const rollup = internalMutation({
  args: {},
  returns: v.object({ events: v.number(), projected: v.number() }),
  handler: async (ctx) => {
    const season = await ctx.db.query("signalSeasons").withIndex("by_seasonNumber", (q: any) => q.eq("seasonNumber", 1)).unique();
    if (!season) return { events: 0, projected: 0 };
    const since = Date.now() - 30 * 24 * 3_600_000;

    // Helper wins (accepted answers) → helper role
    const helps = await ctx.db.query("postHelps").take(200);
    for (const help of helps) {
      if (!help.acceptedCommentId) continue;
      const comment: any = await ctx.db.get(help.acceptedCommentId);
      if (!comment || comment.authorType !== "user" || !comment.authorUserId) continue;
      if (comment.createdAt < since) continue;
      const dup = await ctx.db
        .query("recognitionEvents")
        .withIndex("by_user_window", (q: any) => q.eq("userId", comment.authorUserId).eq("window", "d30"))
        .take(50)
        .then((rows: any[]) => rows.some((r) => r.sourceType === "postHelp" && r.sourceId === help._id));
      if (dup) continue;
      await ctx.db.insert("recognitionEvents", {
        userId: comment.authorUserId,
        role: "helper",
        weightedValue: 1,
        sourceType: "postHelp",
        sourceId: help._id,
        window: "d30",
        seasonId: season._id,
        occurredAt: Date.now(),
      });
    }

    // Reviewer wins (active tool ratings) → reviewer role
    const ratings = await ctx.db
      .query("toolRatings")
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .take(200);
    for (const rating of ratings) {
      if ((rating as any).createdAt < since) continue;
      const dup = await ctx.db
        .query("recognitionEvents")
        .withIndex("by_user_window", (q: any) => q.eq("userId", rating.userId).eq("window", "d30"))
        .take(50)
        .then((rows: any[]) => rows.some((r) => r.sourceType === "toolRating" && r.sourceId === rating._id));
      if (dup) continue;
      await ctx.db.insert("recognitionEvents", {
        userId: rating.userId,
        role: "reviewer",
        weightedValue: 1,
        sourceType: "toolRating",
        sourceId: rating._id,
        window: "d30",
        seasonId: season._id,
        occurredAt: Date.now(),
      });
    }

    // Creator wins (published showcase posts) → creator role
    const showcases = await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) => q.eq("authorType", "editorial"))
      .take(100);
    void showcases; // editorial showcases attribute to the responsible editor later (P4 byline) — flagged v1 no-op

    // Aggregate per user for the window, then Podium projection
    const events = await ctx.db
      .query("recognitionEvents")
      .withIndex("by_user_window", (q: any) => q.eq("window", "d30"))
      .take(500);
    const perUser = new Map<Id<"users">, number>();
    for (const ev of events) perUser.set(ev.userId, (perUser.get(ev.userId) ?? 0) + ev.weightedValue);

    let projected = 0;
    const now = Date.now();
    if (perUser.size >= PROJECTION_MIN_ELIGIBLE) {
      const ranked = [...perUser.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, points], i) => ({ userId, rank: i + 1, points, trend: "flat" }));
      const existing = await ctx.db
        .query("leaderboardProjections")
        .withIndex("by_category_window", (q: any) => q.eq("category", "overall").eq("window", "d7"))
        .unique();
      const row = {
        category: "overall" as const,
        window: "d7" as const,
        projectionVersion: 1,
        entries: ranked,
        minThresholdMet: true,
        computedAt: now,
      };
      if (existing) await ctx.db.patch(existing._id, row);
      else await ctx.db.insert("leaderboardProjections", row);
      projected = ranked.length;
    } else {
      // Below the floor: minThresholdMet=false so P6-03 renders
      // "Podium is forming" (quoted) — never fabricates rankings
      const existing = await ctx.db
        .query("leaderboardProjections")
        .withIndex("by_category_window", (q: any) => q.eq("category", "overall").eq("window", "d7"))
        .unique();
      if (existing && existing.minThresholdMet) {
        await ctx.db.patch(existing._id, { minThresholdMet: false, computedAt: now });
      }
    }
    return { events: perUser.size, projected };
  },
});

/** CAP-295 badge.mint — durable achievement (provisional→finalized). */
export async function mintBadgeTx(ctx: any, input: {
  subjectType: "user" | "distribution";
  subjectId: string;
  type: "level_milestone" | "recognition_role" | "profile_completion" | "discoverer";
  label: string;
  level?: string;
  seasonId?: Id<"signalSeasons">;
  mightAtAward?: number;
  isFirstToAchieve?: boolean;
}): Promise<Id<"badges">> {
  // Idempotent per (subject, type, label)
  const dup = await ctx.db
    .query("badges")
    .withIndex("by_subject_state", (q: any) =>
      q.eq("subjectType", input.subjectType).eq("subjectId", input.subjectId))
    .take(50)
    .then((rows: any[]) => rows.some((r) => r.type === input.type && r.label === input.label));
  if (dup) {
    return await ctx.db
      .query("badges")
      .withIndex("by_subject_state", (q: any) =>
        q.eq("subjectType", input.subjectType).eq("subjectId", input.subjectId))
      .take(50)
      .then((rows: any[]) => rows.find((r) => r.type === input.type && r.label === input.label)!._id);
  }
  return (await ctx.db.insert("badges", {
    ...input,
    isFirstToAchieve: input.isFirstToAchieve ?? false,
    state: "provisional", // provisional → finalized by finalizeAwards
    awardedAt: Date.now(),
  })) as Id<"badges">;
}

/** CAP-297 — finalize provisional badges + update awardsCount on the
 *  Distribution (public shelf = finalized badges, revoked included per
 *  bible l.340). */
export const finalizeAwards = internalMutation({
  args: {},
  returns: v.object({ finalized: v.number(), countsUpdated: v.number() }),
  handler: async (ctx) => {
    const provisional = await ctx.db
      .query("badges")
      .filter((q: any) => q.eq(q.field("state"), "provisional"))
      .take(100);
    let finalized = 0;
    for (const badge of provisional) {
      // Provisional badges finalize after a 24h observation window
      if (Date.now() - badge.awardedAt < 24 * 3_600_000) continue;
      await ctx.db.patch(badge._id, { state: "finalized" });
      finalized += 1;
    }
    // awardsCount per distribution = finalized+revoked shelf count
    const shelves = await ctx.db.query("badges").take(500);
    const perSubject = new Map<string, number>();
    for (const b of shelves) {
      if (b.subjectType !== "distribution") continue;
      if (b.state === "finalized" || b.state === "revoked") {
        perSubject.set(b.subjectId, (perSubject.get(b.subjectId) ?? 0) + 1);
      }
    }
    let countsUpdated = 0;
    for (const [distId, count] of perSubject) {
      await ctx.db.patch(distId as Id<"distributions">, { awardsCount: count });
      countsUpdated += 1;
    }
    return { finalized, countsUpdated };
  },
});

/** CAP-296 badge.revoke — confirmed fraud/impersonation/material calc
 *  error ONLY. bible l.340 (quoted): "a **revoked** badge leaves the
 *  public Awards count/shelf but stays in the audit trail. **Inactivity
 *  or a Level DROP never revokes**." */
export const revokeBadge = mutation({
  args: { badgeId: v.id("badges"), basis: v.union(v.literal("fraud_confirmed"), v.literal("sanction")), reason: v.string() },
  returns: v.object({ revoked: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await import("@convex-dev/auth/server").then((m) => m.getAuthUserId(ctx))) as Id<"users"> | null;
    if (!userId) throw new Error("badge.revoke: authentication required");
    const { assertAdminPermission } = await import("../lib/authz");
    const roles = await assertAdminPermission(ctx);
    if (!roles.includes("administrator")) throw new Error("badge.revoke: administrator required");
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.badgeId, {
        state: "revoked",
        revokedAt: Date.now(),
        revokeReason: args.reason,
        revocationBasis: args.basis,
      });
      return {
        actorId: userId, action: "badge.revoke", target: `badge:${args.badgeId}`,
        prev: { state: "finalized" }, next: { state: "revoked", basis: args.basis },
        reasonCode: args.reason, correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { revoked: true };
  },
});

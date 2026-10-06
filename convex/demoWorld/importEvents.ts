/** demoWorld/importEvents — backdated exposure rawEvents (direct inserts;
 * captureEvent cannot backdate) + postDistributionBuckets as exact rollups of
 * the imported events (A5.2; the production writer is CR-013, deferred). */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { guard, register, batchId } from "./lib";

export const importEvents = internalMutation({
  args: {
    seq: v.number(),
    worldEnd: v.number(),
    exposures: v.array(v.object({
      userEmail: v.string(), postRef: v.string(), postType: v.string(), categoryId: v.optional(v.string()),
      dwellMs: v.number(), viewportQualified: v.boolean(), rankPosition: v.optional(v.number()), offsetMs: v.number(),
    })),
    buckets: v.array(v.object({
      postRef: v.string(), bucketStartOffsetMs: v.number(),
      granularity: v.union(v.literal("hour"), v.literal("day")),
      valuableWeighted: v.number(), distinctCommenterCount: v.number(), replyCount: v.number(),
      saveCount: v.number(), qualifiedReads: v.number(), returns: v.number(), integrityAdjustments: v.number(),
    })),
  },
  returns: v.object({ events: v.number(), buckets: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("events", args.seq);
    const gtBy = async (refKey: string) =>
      (await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post").eq("refKey", refKey)).unique())?.payload ?? null;
    let events = 0, buckets = 0;
    const userBy = new Map<string, string>();
    const uid = async (email: string) => {
      if (!userBy.has(email)) {
        const row = await ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", email)).unique();
        userBy.set(email, row?._id ?? "");
      }
      return userBy.get(email) || undefined;
    };
    for (const e of args.exposures) {
      const p = await gtBy(e.postRef);
      if (!p?.postId) continue;
      const at = args.worldEnd + e.offsetMs;
      const viewerId = await uid(e.userEmail);
      const id = await ctx.db.insert("rawEvents", {
        eventClass: "exposure", eventType: "post.view",
        userId: viewerId as any,
        sequenceInSession: 0, targetType: "post", targetId: p.postId,
        postTypeId: e.postType, categoryId: e.categoryId,
        dwellMs: e.dwellMs, viewportQualified: e.viewportQualified,
        ...(e.rankPosition !== undefined ? { rankPosition: e.rankPosition } : {}),
        source: "direct", schemaVersion: 1,
        isAiPersona: false, isStaff: false, isPersona: false, isCountableAtWrite: false,
        occurredAt: at, receivedAt: at,
      });
      await register(ctx, "rawEvents", id, batch);
      events += 1;
    }
    for (const b of args.buckets) {
      const p = await gtBy(b.postRef);
      if (!p?.postId) continue;
      const id = await ctx.db.insert("postDistributionBuckets", {
        postId: p.postId, bucketStart: args.worldEnd + b.bucketStartOffsetMs,
        granularity: b.granularity,
        valuableWeighted: b.valuableWeighted, distinctCommenterCount: b.distinctCommenterCount,
        replyCount: b.replyCount, saveCount: b.saveCount, qualifiedReads: b.qualifiedReads,
        returns: b.returns, integrityAdjustments: b.integrityAdjustments,
      });
      await register(ctx, "postDistributionBuckets", id, batch);
      buckets += 1;
    }
    return { events, buckets };
  },
});

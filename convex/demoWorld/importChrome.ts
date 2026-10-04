/** demoWorld/importChrome — typed notifications (post_comment /
 * comment_reply / saved_post_activity — notifyBatched shape with backdated
 * windows + unique dedupeKey) + member/comment ground truth + image upload
 * (internalAction: ctx.storage.store is action-only — A5.3) and linking
 * covers → postSeoMeta.ogImageAssetId, avatars → users.avatarAssetId. */
import { internalMutation, internalAction } from "../_generated/server";
import { v } from "convex/values";
import { guard, register, batchId, findUserByEmail } from "./lib";

export const importNotifications = internalMutation({
  args: {
    seq: v.number(), worldEnd: v.number(),
    rows: v.array(v.object({
      recipientEmail: v.string(),
      notificationType: v.union(v.literal("post_comment"), v.literal("comment_reply"), v.literal("saved_post_activity"), v.literal("help_resolution")),
      objectType: v.string(), objectIdRef: v.string(),
      actorEmails: v.array(v.string()), eventCount: v.number(),
      dedupeKey: v.string(), priority: v.optional(v.string()), offsetMs: v.number(),
    })),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("notifications", args.seq);
    let inserted = 0, skipped = 0;
    for (const n of args.rows) {
      const existing = await ctx.db.query("notifications").withIndex("by_dedupe", (q: any) => q.eq("dedupeKey", n.dedupeKey)).unique();
      if (existing) { skipped += 1; continue; }
      const recipient = await findUserByEmail(ctx, n.recipientEmail);
      if (!recipient) { skipped += 1; continue; }
      const actors: string[] = [];
      for (const e of n.actorEmails) { const a = await findUserByEmail(ctx, e); if (a) actors.push(a); }
      const at = args.worldEnd + n.offsetMs;
      const gt = n.objectIdRef
        ? (await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", n.objectType === "post" ? "post" : "comment").eq("refKey", n.objectIdRef)).unique())?.payload
        : null;
      const id = await ctx.db.insert("notifications", {
        recipientUserId: recipient, notificationType: n.notificationType,
        objectType: n.objectType, objectId: gt?.[n.objectType === "post" ? "postId" : "commentId"] ?? n.objectIdRef,
        actorUserIds: actors as any, eventCount: n.eventCount,
        dedupeKey: n.dedupeKey, status: "unread", priority: n.priority ?? "normal",
        batchWindowStartedAt: at, batchWindowEndsAt: at + 3_600_000,
        createdAt: at, updatedAt: at,
      });
      await register(ctx, "notifications", id, batch);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

export const importGroundTruth = internalMutation({
  args: {
    seq: v.number(),
    rows: v.array(v.object({
      scope: v.string(), refKey: v.string(), payload: v.any(),
    })),
  },
  returns: v.object({ inserted: v.number(), skipped: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("groundTruth", args.seq);
    let inserted = 0, skipped = 0;
    for (const g of args.rows) {
      if (g.scope === "post" || g.scope === "comment") { skipped += 1; continue; } // written by their importers
      const existing = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", g.scope).eq("refKey", g.refKey)).unique();
      if (existing) { skipped += 1; continue; }
      const id = await ctx.db.insert("demoGroundTruth", { scope: g.scope, refKey: g.refKey, batch, payload: g.payload });
      await register(ctx, "demoGroundTruth", id, batch);
      inserted += 1;
    }
    return { inserted, skipped };
  },
});

/** Image upload — internalAction (ctx.storage.store is action-only, storage.d.ts). */
export const uploadImage = internalAction({
  args: { bytes: v.string(), contentType: v.string() }, // bytes = base64
  returns: v.object({ storageId: v.string() }),
  handler: async (ctx, args) => {
    guard();
    const blob = new Blob([Uint8Array.from(atob(args.bytes), (ch) => ch.charCodeAt(0))]);
    const storageId = await ctx.storage.store(blob);
    return { storageId };
  },
});

/** Link a stored cover to a post (postSeoMeta.ogImageAssetId — A5.3). */
export const linkCover = internalMutation({
  args: { postRef: v.string(), storageId: v.string() },
  returns: v.object({ linked: v.boolean() }),
  handler: async (ctx, args) => {
    guard();
    const gt = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post").eq("refKey", args.postRef)).unique();
    if (!gt?.payload?.postId) return { linked: false };
    const seo = await ctx.db.query("postSeoMeta").withIndex("by_postId", (q: any) => q.eq("postId", gt.payload.postId)).unique();
    if (seo) await ctx.db.patch(seo._id, { ogImageAssetId: args.storageId as any });
    return { linked: true };
  },
});

/** Link a stored avatar to a member (users.avatarAssetId — A5.3). */
export const linkAvatar = internalMutation({
  args: { email: v.string(), storageId: v.string() },
  returns: v.object({ linked: v.boolean() }),
  handler: async (ctx, args) => {
    guard();
    const user = await findUserByEmail(ctx, args.email);
    if (!user) return { linked: false };
    await ctx.db.patch(user, { avatarAssetId: args.storageId });
    return { linked: true };
  },
});

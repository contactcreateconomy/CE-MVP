/** demoWorld/importChrome — typed notifications (post_comment /
 * comment_reply / saved_post_activity — notifyBatched shape with backdated
 * windows + unique dedupeKey) + member/comment ground truth + image upload
 * (internalAction: ctx.storage.store is action-only — A5.3) and linking
 * covers → postSeoMeta.ogImageAssetId, avatars → users.avatarAssetId. */
import { internalMutation, internalAction, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
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
    // the Blob's `type` IS the stored content type — without it the storage
    // endpoint serves the asset headerless and browsers refuse to decode it
    const blob = new Blob([Uint8Array.from(atob(args.bytes), (ch) => ch.charCodeAt(0))], { type: args.contentType });
    const storageId = await ctx.storage.store(blob);
    return { storageId };
  },
});

/** Chunked upload — Windows caps a single CLI arg near 32KB, so cover-sized
 * base64 payloads cannot pass through `convex run` in one piece. Chunks are
 * ephemeral demoGroundTruth rows (scope imgChunk, deliberately NOT registered
 * — uploadImageFinalize deletes them once the blob is stored). */
export const uploadImageChunk = internalMutation({
  args: { uploadId: v.string(), seq: v.number(), total: v.number(), contentType: v.string(), chunk: v.string() },
  returns: v.object({ stored: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const refKey = `imgChunk:${args.uploadId}:${args.seq}`;
    const existing = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "imgChunk").eq("refKey", refKey)).unique();
    if (!existing) {
      await ctx.db.insert("demoGroundTruth", {
        scope: "imgChunk", refKey, batch: batchId("imgChunk", args.seq),
        payload: { uploadId: args.uploadId, seq: args.seq, total: args.total, contentType: args.contentType, chunk: args.chunk },
      });
    }
    return { stored: args.seq };
  },
});

export const chunksForUpload = internalQuery({
  args: { uploadId: v.string() },
  returns: v.array(v.object({ seq: v.number(), chunk: v.string(), contentType: v.optional(v.string()) })),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "imgChunk")).collect();
    return rows
      .filter((r: any) => r.payload?.uploadId === args.uploadId)
      .map((r: any) => ({ seq: r.payload.seq as number, chunk: r.payload.chunk as string, contentType: r.payload.contentType as string | undefined }))
      .sort((a, b) => a.seq - b.seq);
  },
});

export const deleteImageChunks = internalMutation({
  args: { uploadId: v.optional(v.string()), sweepAll: v.optional(v.boolean()) },
  returns: v.object({ deleted: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const rows = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "imgChunk")).collect();
    let deleted = 0;
    for (const r of rows) {
      if (!args.sweepAll && r.payload?.uploadId !== args.uploadId) continue;
      await ctx.db.delete(r._id);
      deleted++;
    }
    return { deleted };
  },
});

export const uploadImageFinalize = internalAction({
  args: { uploadId: v.string() },
  returns: v.object({ storageId: v.string(), chunks: v.number() }),
  handler: async (ctx, args): Promise<{ storageId: string; chunks: number }> => {
    guard();
    const parts = (await ctx.runQuery(internal.demoWorld.importChrome.chunksForUpload, { uploadId: args.uploadId })) as { seq: number; chunk: string; contentType?: string }[];
    if (!parts.length) throw new Error(`uploadImageFinalize: no chunks for ${args.uploadId}`);
    const bytes = parts.map((p) => p.chunk).join("");
    const blob = new Blob([Uint8Array.from(atob(bytes), (ch) => ch.charCodeAt(0))], { type: parts[0].contentType ?? "application/octet-stream" });
    const storageId = await ctx.storage.store(blob);
    const del = (await ctx.runMutation(internal.demoWorld.importChrome.deleteImageChunks, { uploadId: args.uploadId })) as { deleted: number };
    return { storageId, chunks: del.deleted };
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

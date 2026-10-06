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
    await ctx.runMutation(internal.demoWorld.importChrome.registerStorageIds, { ids: [storageId] }); // removable via purgeDemoStorage
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
    await ctx.runMutation(internal.demoWorld.importChrome.registerStorageIds, { ids: [storageId] }); // removable via purgeDemoStorage
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

/** Removal support: purge every storage file the demo registered (table
 * "_storage" in demoRegistry — uploadImage/Finalize register their ids).
 * storage.delete is action-only, hence the action + runMutation split. */
export const deleteRegisteredStorageBatch = internalQuery({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ remaining: v.number(), ids: v.array(v.string()) }),
  handler: async (ctx, args) => {
    guard();
    const rows = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", "_storage")).take(args.limit ?? 500);
    return { remaining: rows.length, ids: rows.map((r: any) => r.docId) };
  },
});

export const purgeDemoStorage = internalAction({
  args: { limit: v.optional(v.number()) },
  returns: v.object({ deleted: v.number(), missing: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = await ctx.runQuery(internal.demoWorld.importChrome.deleteRegisteredStorageBatch, { limit: args.limit ?? 200 });
    let deleted = 0, missing = 0;
    for (const id of batch.ids) {
      try { await ctx.storage.delete(id as any); deleted += 1; } catch { missing += 1; }
      const reg = await ctx.runQuery(internal.demoWorld.importChrome.storageRegistryRow, { docId: id });
      if (reg) await ctx.runMutation(internal.demoWorld.importChrome.deleteRegistryRow, { id: reg });
    }
    return { deleted, missing };
  },
});

export const storageRegistryRow = internalQuery({
  args: { docId: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", "_storage")).collect();
    return rows.find((r: any) => r.docId === args.docId)?._id ?? null;
  },
});

export const deleteRegistryRow = internalMutation({
  args: { id: v.string() },
  returns: v.object({ ok: v.boolean() }),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id as any);
    return { ok: true };
  },
});

/** One-time backfill: register storage ids that predate upload-time
 * registration (the live assets + the two orphaned crash batches). */
export const registerStorageIds = internalMutation({
  args: { seq: v.optional(v.number()), ids: v.array(v.string()) },
  returns: v.object({ registered: v.number() }),
  handler: async (ctx, args) => {
    guard();
    const batch = batchId("storage-backfill", args.seq ?? 0);
    const existing = new Set((await ctx.db.query("demoRegistry").withIndex("by_table", (q: any) => q.eq("table", "_storage")).collect()).map((r: any) => r.docId));
    let registered = 0;
    for (const id of args.ids) {
      if (existing.has(id)) continue;
      await register(ctx, "_storage", id, batch);
      existing.add(id);
      registered += 1;
    }
    return { registered };
  },
});

/** Replay proof: content fingerprint over every demo post and comment
 * (id-independent: gt refKeys + titles/bodies), for remove → re-import
 * identity checks. Deterministic FNV-style lanes; times and ids excluded. */
export const worldFingerprint = internalQuery({
  args: {},
  returns: v.object({ posts: v.number(), comments: v.number(), fingerprint: v.string(), first: v.string() }),
  handler: async (ctx) => {
    guard();
    const postAnchors = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "post")).collect();
    const parts: string[] = [];
    for (const a of postAnchors) {
      const p = a.payload?.postId ? ((await ctx.db.get(a.payload.postId)) as any) : null;
      if (p) parts.push(`P|${a.refKey}|${p.title}|${p.body}`);
    }
    const commentAnchors = await ctx.db.query("demoGroundTruth").withIndex("by_scope_ref", (q: any) => q.eq("scope", "comment")).collect();
    for (const c of commentAnchors) {
      const cm = c.payload?.commentId ? ((await ctx.db.get(c.payload.commentId)) as any) : null;
      if (cm) parts.push(`C|${c.refKey}|${cm.body}`);
    }
    parts.sort();
    const s = parts.join("\n");
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < s.length; i++) {
      const ch = s.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 16777619) >>> 0;
      h2 = Math.imul(h2 ^ ch, 2246822519 + i) >>> 0;
    }
    return {
      posts: postAnchors.length,
      comments: commentAnchors.length,
      fingerprint: (h1 >>> 0).toString(16).padStart(8, "0") + (h2 >>> 0).toString(16).padStart(8, "0"),
      first: parts[0]?.slice(0, 100) ?? "",
    };
  },
});

/** worldFingerprint at full-corpus scale: the one-shot query exceeds the
 * per-execution read cap (~33k reads over 16.6k anchors + their rows), so the
 * driver pages the SAME parts through here and folds the identical hash
 * client-side (sort + FNV lanes unchanged — fingerprint values stay comparable). */
export const fingerprintParts = internalQuery({
  args: { scope: v.string(), cursor: v.optional(v.union(v.string(), v.null())) },
  returns: v.object({ parts: v.array(v.string()), continueCursor: v.string(), isDone: v.boolean() }),
  handler: async (ctx, args) => {
    guard();
    const page = await ctx.db
      .query("demoGroundTruth")
      .withIndex("by_scope_ref", (q: any) => q.eq("scope", args.scope))
      .paginate((args.cursor ? { numItems: 800, cursor: args.cursor } : { numItems: 800 }) as any);
    const parts: string[] = [];
    for (const a of page.page as any[]) {
      if (args.scope === "post") {
        const p = a.payload?.postId ? ((await ctx.db.get(a.payload.postId)) as any) : null;
        if (p) parts.push(`P|${a.refKey}|${p.title}|${p.body}`);
      } else {
        const cm = a.payload?.commentId ? ((await ctx.db.get(a.payload.commentId)) as any) : null;
        if (cm) parts.push(`C|${a.refKey}|${cm.body}`);
      }
    }
    return { parts, continueCursor: page.continueCursor, isDone: page.isDone };
  },
});

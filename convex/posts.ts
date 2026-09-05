/**
 * posts — SLICE-P4-02: posts.create / posts.update / draft save / My Drafts.
 *
 * CAP-086: "Auth required; runs R-TYP, R-URL, R-GATE, INV-2; inserts posts +
 * matching extension row transactionally (1:1)."
 * CAP-087 (R-URL): "authorType='user' AND body matches URL patterns AND
 * field ≠ postShowcases.projectUrl → reject 422 POST_URL_NOT_ALLOWED.
 * Runs before persistence + before moderation."
 * CAP-531: "one draft state with three entry triggers, not three parallel systems."
 * verdictScore W2-E4: "auto-computed same-transaction as the average of
 * per-dimension scores (excluding value_for_money when not_applicable)."
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";

// ── R-URL pattern (CAP-087): https?://, www., bare domain.tld, obfuscation ──
const URL_PATTERNS = [
  /https?:\/\//i,
  /www\./i,
  /\b(?:[a-z0-9-]+\.)+[a-z]{2,}\b/i, // bare domain.tld — alpha TLD ≥2 chars, so decimals ("4.5", "v1.2") don't match
  /\s*\(\s*(?:dot|\.)\s*\)\s*/i,   // obfuscation: "example (dot) com"
  /\s*\[\s*(?:dot|\.)\s*\]\s*/i,
];

/** CAP-087 — R-URL check on the BODY. The postShowcases.projectUrl FIELD is
 *  the sole exempt location — the body itself is always checked (field ≠
 *  body: an exempt field never exempts the body). Exported for P4-11's
 *  CAP-046 publish-time re-run (edits can reintroduce URLs). */
export function checkNoUrls(body: string): void {
  for (const pattern of URL_PATTERNS) {
    if (pattern.test(body)) {
      throw new Error("POST_URL_NOT_ALLOWED: user posts cannot contain URLs (CAP-087)");
    }
  }
}

/** Showcase projectUrl field validation — the single controlled outbound
 *  URL. P4-15's submitProjectUrl adds the allowlist + approval flow; here
 *  only transport + shape are checked. */
function validateProjectUrl(url: string): void {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") throw new Error();
  } catch {
    throw new Error("POST_URL_NOT_ALLOWED: showcase projectUrl must be a valid HTTPS URL");
  }
}

/** W2-E4 — verdictScore auto-compute (average of dimensions, excluding not_applicable vfm). */
function computeVerdictScore(dimensionScores: Record<string, number | "not_applicable">): number {
  const valid = Object.entries(dimensionScores).filter(([, val]) => typeof val === "number") as [string, number][];
  if (valid.length === 0) throw new Error("verdictScore: at least one numeric dimension required");
  const sum = valid.reduce((acc, [, score]) => acc + score, 0);
  return Math.round((sum / valid.length) * 10) / 10;
}

// ── Extension data validators (per post type) ──
const extensionData = v.optional(v.any()); // typed per-extension in the handler

export const createPost = mutation({
  args: {
    type: v.union(
      v.literal("review"), v.literal("compare"), v.literal("help"),
      v.literal("spark"), v.literal("debate"), v.literal("list"), v.literal("showcase"),
    ),
    title: v.string(),
    body: v.string(),
    categoryId: v.string(),
    toolIds: v.optional(v.array(v.string())),
    extensionData: v.optional(v.any()),
    // Review-specific: per-dimension scores for verdictScore computation
    dimensionScores: v.optional(v.any()),
    // Showcase-specific: the SINGLE controlled outbound URL
    projectUrl: v.optional(v.string()),
    // Draft or publish
    asDraft: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // R-GATE: assertCustomerCapability with the create_post key
    await assertCustomerCapability(ctx, "create_post");

    // R-TYP: type must be active in postTypeConfig (locked types hidden — CAP-104)
    const typeConfig = await ctx.db
      .query("postTypeConfig")
      .withIndex("by_type", (q: any) => q.eq("type", args.type))
      .unique();
    if (!typeConfig || typeConfig.state !== "active") {
      throw new Error(`R-TYP: post type "${args.type}" is not active (locked or unregistered)`);
    }

    // R-URL: CAP-087 — check body for URLs (before persistence, before
    // moderation); the showcase projectUrl FIELD is validated separately.
    checkNoUrls(args.body);
    if (args.type === "showcase" && args.projectUrl) validateProjectUrl(args.projectUrl);

    // INV-2: user posts must have authorUserId, no personaId
    const userId = await getAuthUserId(ctx) as any;
    if (!userId) throw new Error("posts.create: authentication required");

    const lifecycleStatus = args.asDraft ? "draft" : "ready";

    return await writeAudited(ctx, async (actx) => {
      // 1. Insert the posts row
      const postId = await actx.db.insert("posts", {
        authorType: "user",
        authorUserId: userId,
        type: args.type,
        title: args.title,
        body: args.body,
        categoryId: args.categoryId,
        toolIds: args.toolIds ?? [],
        lifecycleStatus,
        moderationStatus: lifecycleStatus === "draft" ? "not_required" : "pending",
        visibility: lifecycleStatus === "draft" ? "private" : "public",
        createdAt: Date.now(),
      });

      // 2. Insert the matching extension row (transactional 1:1 — CAP-086)
      await insertExtensionRow(actx, postId, args);

      // 3. Create revision 1
      await actx.db.insert("postRevisions", {
        postId, revisionNumber: 1, title: args.title, body: args.body,
        changeType: "create", changedByUserId: userId, createdAt: Date.now(),
      });

      return {
        actorId: userId,
        action: "posts.create",
        target: `post:${postId}`,
        prev: null,
        next: { type: args.type, lifecycleStatus },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** Insert the type-specific extension row (1:1 with posts). */
async function insertExtensionRow(actx: any, postId: string, args: any): Promise<void> {
  const data = args.extensionData ?? {};
  switch (args.type) {
    case "review": {
      const verdictScore = args.dimensionScores ? computeVerdictScore(args.dimensionScores) : undefined;
      await actx.db.insert("postReviews", { postId, toolId: data.toolId ?? "", verdictScore });
      break;
    }
    case "compare":
      await actx.db.insert("postCompares", { postId, toolIds: args.toolIds ?? [], qualitativeGrid: data.qualitativeGrid });
      break;
    case "spark":
      await actx.db.insert("postSparks", { postId, statement: data.statement ?? args.title });
      break;
    case "debate":
      await actx.db.insert("postDebates", { postId, proposition: data.proposition ?? args.title, agreeCount: 0, disagreeCount: 0, abstainCount: 0 });
      break;
    case "list":
      await actx.db.insert("postLists", { postId, mode: data.mode ?? "community_ranked", intro: data.intro ?? "" });
      break;
    case "showcase":
      await actx.db.insert("postShowcases", { postId, theThing: data.theThing ?? args.body, projectUrl: args.projectUrl });
      break;
    case "help":
      await actx.db.insert("postHelps", { postId, problemStatement: data.problemStatement ?? args.title, resolvedStatus: "open" });
      break;
  }
}

export const updatePost = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    body: v.optional(v.string()),
    toolIds: v.optional(v.array(v.string())),
    extensionData: v.optional(v.any()),
    dimensionScores: v.optional(v.any()),
    projectUrl: v.optional(v.string()),
    asDraft: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await assertCustomerCapability(ctx, "create_post");

    const post = await ctx.db.get(args.postId);
    if (!post) throw new Error("posts.update: not found");
    const actorId = (await getAuthUserId(ctx)) as any;
    if (post.authorUserId !== actorId) {
      throw new Error("posts.update: not the author");
    }

    const body = args.body ?? post.body;
    // CAP-087 on the update path too — the body is always checked; the
    // showcase projectUrl FIELD (on postShowcases, not posts) is validated
    // separately below.
    checkNoUrls(body);
    if (post.type === "showcase" && args.projectUrl !== undefined) validateProjectUrl(args.projectUrl);

    return await writeAudited(ctx, async (actx) => {
      const latestRev = await actx.db
        .query("postRevisions")
        .withIndex("by_postId_revisionNumber", (q: any) => q.eq("postId", args.postId))
        .order("desc")
        .first();
      const nextRev = (latestRev?.revisionNumber ?? 0) + 1;

      await actx.db.patch(args.postId, {
        title: args.title ?? post.title,
        body,
        lifecycleStatus: args.asDraft ? "draft" : post.lifecycleStatus,
        toolIds: args.toolIds !== undefined ? args.toolIds : post.toolIds,
      });

      await actx.db.insert("postRevisions", {
        postId: args.postId, revisionNumber: nextRev,
        title: args.title ?? post.title, body,
        changeType: "update",
        changedByUserId: actorId,
        createdAt: Date.now(),
      });

      // W2-E4 — extension updates ride the SAME transaction as the post
      // update (verdictScore recomputed on edit, extension fields applied).
      await patchExtensionRow(actx, args.postId, post.type, args);

      return {
        actorId,
        action: "posts.update",
        target: `post:${args.postId}`,
        prev: { title: post.title, body: post.body },
        next: { title: args.title ?? post.title, body },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** Patch the type-specific extension row in the same transaction (W2-E4).
 *  Only provided fields are applied — undefined args leave the stored value. */
async function patchExtensionRow(actx: any, postId: string, type: string, args: any): Promise<void> {
  const data = args.extensionData ?? {};
  switch (type) {
    case "review": {
      const row = (await actx.db.query("postReviews").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (data.toolId !== undefined) patch.toolId = data.toolId;
      if (data.verdictSummary !== undefined) patch.verdictSummary = data.verdictSummary;
      if (data.pros !== undefined) patch.pros = data.pros;
      if (data.cons !== undefined) patch.cons = data.cons;
      if (args.dimensionScores) patch.verdictScore = computeVerdictScore(args.dimensionScores);
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "compare": {
      const row = (await actx.db.query("postCompares").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (args.toolIds !== undefined) patch.toolIds = args.toolIds;
      if (data.qualitativeGrid !== undefined) patch.qualitativeGrid = data.qualitativeGrid;
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "spark": {
      const row = (await actx.db.query("postSparks").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      if (data.statement !== undefined) await actx.db.patch(row._id, { statement: data.statement });
      break;
    }
    case "debate": {
      const row = (await actx.db.query("postDebates").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      if (data.proposition !== undefined) await actx.db.patch(row._id, { proposition: data.proposition });
      break;
    }
    case "list": {
      const row = (await actx.db.query("postLists").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (data.mode !== undefined) patch.mode = data.mode;
      if (data.intro !== undefined) patch.intro = data.intro;
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "showcase": {
      const row = (await actx.db.query("postShowcases").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      const patch: Record<string, unknown> = {};
      if (data.theThing !== undefined) patch.theThing = data.theThing;
      if (args.projectUrl !== undefined) patch.projectUrl = args.projectUrl;
      if (Object.keys(patch).length) await actx.db.patch(row._id, patch);
      break;
    }
    case "help": {
      const row = (await actx.db.query("postHelps").withIndex("by_postId", (q: any) => q.eq("postId", postId)).unique()) as any;
      if (!row) break;
      if (data.problemStatement !== undefined) await actx.db.patch(row._id, { problemStatement: data.problemStatement });
      break;
    }
  }
}

/** CAP-532 — My Drafts: lifecycleStatus=draft AND authorUserId=self. */
export const myDrafts = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx) as any;
    if (!userId) return [];
    return await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) =>
        q.eq("authorType", "user").eq("authorUserId", userId),
      )
      .filter((q: any) => q.eq(q.field("lifecycleStatus"), "draft"))
      .collect();
  },
});

/** CAP-105 — postTypeConfig.list for the composer (active types only). */
export const listActiveTypes = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("postTypeConfig")
      .filter((q: any) => q.eq(q.field("state"), "active"))
      .collect();
  },
});

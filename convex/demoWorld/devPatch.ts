/**
 * demoWorld/devPatch — RED/GREEN verification probe for seed:check (S00 fix).
 *
 * Changes ONE demo post's title by ground-truth refKey so the fingerprint's
 * content sensitivity can be proven live (title changed → check FAILS; title
 * restored → check passes again). Loopback-guarded like every demoWorld
 * entry point; never exposed to product surfaces.
 */
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { guard } from "./lib";

export const patchPostTitle = internalMutation({
  args: { ref: v.string(), title: v.string() },
  returns: v.object({ ok: v.boolean(), previousTitle: v.union(v.string(), v.null()) }),
  handler: async (ctx, args) => {
    guard();
    const gt = await ctx.db
      .query("demoGroundTruth")
      .withIndex("by_scope_ref", (q: any) => q.eq("scope", "post").eq("refKey", args.ref))
      .unique();
    const postId = gt?.payload?.postId ?? null;
    if (!postId) return { ok: false, previousTitle: null };
    const post = (await ctx.db.get(postId)) as { title?: string } | null;
    if (!post) return { ok: false, previousTitle: null };
    await ctx.db.patch(postId, { title: args.title });
    return { ok: true, previousTitle: post.title ?? null };
  },
});

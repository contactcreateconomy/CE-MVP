import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

const appId = v.union(
  v.literal("forum"),
  v.literal("seller"),
  v.literal("admin"),
  v.literal("marketplace"),
);

const membershipView = v.object({
  _id: v.id("memberships"),
  app: appId,
  role: v.string(),
});

export const current = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("users"),
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      image: v.optional(v.string()),
      handle: v.optional(v.string()),
      memberships: v.array(membershipView),
    }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }
    const memberships = await ctx.db
      .query("memberships")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      handle: user.handle,
      memberships: memberships.map((m) => ({
        _id: m._id,
        app: m.app,
        role: m.role,
      })),
    };
  },
});

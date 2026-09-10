import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * P7-CLEANUP: the legacy membership view retired with the forum-scoped
 * tables. The canonical current-view keeps the auth-ui contract (identity +
 * a role signal) from users + roleAssignments (CAP-390's own table).
 */
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
      isStaff: v.optional(v.boolean()),
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
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      handle: user.handle,
      isStaff: user.isStaff ?? undefined,
    };
  },
});

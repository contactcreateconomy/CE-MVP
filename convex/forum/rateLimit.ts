import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { RATE_MAX_PER_WINDOW, RATE_WINDOWS_MS, type RateKind } from "./limits";

export async function consumeWriteBucket(
  ctx: MutationCtx,
  userId: Id<"users">,
  kind: RateKind,
): Promise<void> {
  const windowMs = RATE_WINDOWS_MS[kind];
  const max = RATE_MAX_PER_WINDOW[kind];
  const now = Date.now();

  const existing = await ctx.db
    .query("forumWriteBuckets")
    .withIndex("by_user_kind", (q) => q.eq("userId", userId).eq("kind", kind))
    .unique();

  if (!existing || now - existing.windowStartMs >= windowMs) {
    if (existing) {
      await ctx.db.patch(existing._id, { count: 1, windowStartMs: now });
    } else {
      await ctx.db.insert("forumWriteBuckets", {
        userId,
        kind,
        count: 1,
        windowStartMs: now,
      });
    }
    return;
  }

  if (existing.count >= max) {
    throw new Error("Rate limit exceeded. Try again later.");
  }

  await ctx.db.patch(existing._id, { count: existing.count + 1 });
}

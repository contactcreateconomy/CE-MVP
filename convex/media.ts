/**
 * media — SLICE-P7-CLEANUP port: CAP-013's upload-URL mutation, moved off
 * the retired legacy module. Rate-limited (5/1h per user, the CAP-013
 * literal in lib/rateLimit) + audited (CAP-012 discipline). Two live
 * consumers: the composer cover image and the affiliate-inventory logo.
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireUser } from "./lib/authz";
import { checkRateLimit } from "./lib/rateLimit";
import { writeAudit, newCorrelationId } from "./lib/audit";

export const generateUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    const userId = await requireUser(ctx, "media.generateUploadUrl");
    // CAP-013 (quoted): "5 / 1h per user"
    await checkRateLimit(ctx, "media.upload", { kind: "user", value: userId });
    const url = await ctx.storage.generateUploadUrl();
    await writeAudit(ctx, {
      actorId: userId, action: "media.generateUploadUrl",
      target: "storage:upload_url", correlationId: newCorrelationId(),
    });
    return url;
  },
});

/** Storage URL read (P7-CLEANUP port of the legacy helper). */
export const getStorageUrl = query({
  args: { storageId: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, { storageId }) =>
    ctx.storage.getUrl(storageId as any),
});

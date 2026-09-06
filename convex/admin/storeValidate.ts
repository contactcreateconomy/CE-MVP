"use node";

/**
 * storeValidate — SLICE-P6-14 (node tier): CAP-235/240 — the SSRF-safe
 * inspection + rescan ACTIONS. Split from admin/store.ts per the P4
 * pollers pattern ("use node" for safeFetch's node:dns; the V8 writers
 * in admin/store.ts own every table write via runMutation).
 */

import { action } from "../_generated/server";
import { internal } from "../_generated/api";
import { v } from "convex/values";
import { safeFetchText } from "../lib/safeFetch";

async function inspect(url: string): Promise<{ disposition: string; fingerprint: Record<string, unknown> }> {
  let disposition = "needs_human";
  const fingerprint: Record<string, unknown> = { ts: Date.now() };
  try {
    const result = await safeFetchText(url, { timeoutMs: 10_000 });
    if (result.ok) {
      fingerprint.titleHash = `${result.text.length}:${result.text.slice(0, 64)}`;
      fingerprint.contentHash = `${result.text.length}`;
      disposition = "pass";
    } else {
      disposition = "fail";
    }
  } catch {
    disposition = "needs_human"; // probe failure degrades — never a silent pass (CAP-011)
  }
  return { disposition, fingerprint };
}

/** CAP-235 — initial inspection (console-triggered). */
export const inspectLinkAction = action({
  args: { storefrontLinkId: v.id("storefrontLinks") },
  returns: v.object({ disposition: v.string() }),
  handler: async (ctx, args) => {
    const link = await ctx.db.get(args.storefrontLinkId);
    if (!link) throw new Error("inspect: link not found");
    const result = await inspect(link.submittedUrl);
    await ctx.runMutation(internal.admin.store.recordInspection, {
      storefrontLinkId: args.storefrontLinkId,
      runType: "initial",
      disposition: result.disposition,
      fingerprint: { ...result.fingerprint, finalHost: link.finalRegistrableDomain, redirectHash: link.redirectChainHash },
    });
    return { disposition: result.disposition };
  },
});

/** CAP-240 — rescan pass over locked links; drift → under_review (CAP-242). */
export const rescanLinksAction = action({
  args: {},
  returns: v.object({ rescanned: v.number(), flagged: v.number() }),
  handler: async (ctx) => {
    const locked = await ctx.db
      .query("storefrontLinks")
      .withIndex("by_validationState", (q: any) => q.eq("validationState", "approved_locked"))
      .take(10); // 24h-high/7d-normal cadence — bounded batch per pass
    let rescanned = 0;
    let flagged = 0;
    for (const link of locked) {
      const prior = await ctx.db
        .query("linkValidations")
        .withIndex("by_link", (q: any) => q.eq("storefrontLinkId", link._id))
        .order("desc")
        .take(1);
      const result = await inspect(link.submittedUrl);
      rescanned += 1;
      await ctx.runMutation(internal.admin.store.recordInspection, {
        storefrontLinkId: link._id,
        runType: "rescan",
        disposition: result.disposition,
        fingerprint: { ...result.fingerprint, finalHost: link.finalRegistrableDomain, redirectHash: link.redirectChainHash },
      });
      const priorFp = (prior[0]?.fingerprint ?? {}) as any;
      if (priorFp.titleHash && result.fingerprint.titleHash && priorFp.titleHash !== result.fingerprint.titleHash) {
        // CAP-242 (quoted): "material intermediate change triggers review"
        await ctx.runMutation(internal.admin.store.recordDriftFlip, { storefrontLinkId: link._id });
        flagged += 1;
      }
    }
    return { rescanned, flagged };
  },
});

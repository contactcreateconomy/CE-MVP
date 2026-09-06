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
    // CAP-010: unpinned probe = "disabled" → needs_human (manual review
    // degrade — the P6-14 human lane gates CAP-237 either way)
    const result = await safeFetchText(url, { mode: "external_destination_probe", timeoutMs: 10_000 });
    const text = result.text ?? "";
    if (result.status === "ok" && text.length > 0) {
      fingerprint.titleHash = `${text.length}:${text.slice(0, 64)}`;
      fingerprint.contentHash = `${text.length}`;
      disposition = "pass";
    } else if (result.status === "blocked" || result.status === "error") {
      disposition = "fail";
    } else {
      disposition = "needs_human"; // disabled probe degrades — never a silent pass
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
    const link: any = await ctx.runMutation(internal.admin.store.loadLinkForInspection, { storefrontLinkId: args.storefrontLinkId });
    if (!link) throw new Error("inspect: link not found");
    const result = await inspect(link.submittedUrl);
    await ctx.runMutation(internal.admin.store.recordInspection, {
      storefrontLinkId: args.storefrontLinkId,
      runType: "initial",
      disposition: result.disposition as "pass" | "needs_human" | "fail",
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
    const batch: any[] = await ctx.runMutation(internal.admin.store.loadRescanBatch, {});
    let rescanned = 0;
    let flagged = 0;
    for (const link of batch) {
      const result = await inspect(link.submittedUrl);
      rescanned += 1;
      await ctx.runMutation(internal.admin.store.recordInspection, {
        storefrontLinkId: link.linkId,
        runType: "rescan",
        disposition: result.disposition as "pass" | "needs_human" | "fail",
        fingerprint: { ...result.fingerprint, finalHost: link.finalRegistrableDomain, redirectHash: link.redirectChainHash },
      });
      // CAP-242 (quoted): "material intermediate change triggers review"
      if (link.priorTitleHash && result.fingerprint.titleHash && link.priorTitleHash !== result.fingerprint.titleHash) {
        await ctx.runMutation(internal.admin.store.recordDriftFlip, { storefrontLinkId: link.linkId });
        flagged += 1;
      }
    }
    return { rescanned, flagged };
  },
});

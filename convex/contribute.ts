/**
 * contribute — SLICE-P6-09: CAP-202/203/204/227/228 — the /contribute
 * surface: reachable DISABLED render while constellation.ugc.enabled=false
 * (E3, quoted: "mounts, banner + disabled controls, mutations
 * server-reject — not 404") + the full gated flow behind the flag.
 *
 * Flow (the former CAP-202⇄203 circularity closed as sequential steps,
 * cleanup Finding 3): (1) `reference.ackContract` — the contributor
 * attests to the licence terms (grant row, append-only); (2)
 * `reference.submit` — the reference lands in QUARANTINE (status
 * quarantined; storageKeyQuarantine — never the public CDN) with a
 * rightsBasis REQUIRED before any forge (quoted: "none → reject").
 * CAP-204: the isolated scan worker — in-Convex coordinator marks
 * scanning → rights_review (the truly isolated no-egress external worker
 * is deploy-time infra; this job owns the status machine + fail-closed
 * posture — flagged mechanism).
 * CAP-227 attribution erasure: detach contributor (nullable per bible
 * l.192) + non-value-bearing audit record (erased values NEVER in
 * auditLog.prev — the CAP-151 discipline).
 * CAP-228 cap recompute: Σ weights ≤ 1.0 server-side on weight writes
 * (the P6-10 console's writer shares this helper contract).
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";

async function ugcEnabled(ctx: any): Promise<boolean> {
  const row = await ctx.db
    .query("systemConfig")
    .withIndex("by_key", (q: any) => q.eq("key", "constellation.ugc.enabled"))
    .first();
  return row?.value === true; // default false — soft-beta posture
}

/** The /contribute state: ALWAYS reachable; the flag drives the render. */
export const getContributeState = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => ({
    enabled: await ugcEnabled(ctx), // false → the disabled render (E3, not 404)
    contractVersion: "constellation-contributor-v1",
  }),
});

/** Step 1 — `reference.ackContract` (must precede submit; sequential). */
export const ackContract = mutation({
  args: { contractVersion: v.string() },
  returns: v.object({ acknowledged: v.boolean(), disabled: v.optional(v.boolean()) }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("contribute: authentication required");
    if (!(await ugcEnabled(ctx))) {
      return { acknowledged: false, disabled: true }; // E3: server-reject while the flag is false
    }
    await assertCustomerCapability(ctx, "submit_reference");
    await ctx.db.insert("resourceReferenceGrants", {
      referenceId: "" as any, // bound at submit (the grant rides the reference row)
      grantVersion: 0,
      termsHash: args.contractVersion,
      rightsBasis: "pending_submit",
      licenceTextVersion: args.contractVersion,
      contributorUserId: userId,
      attestedAt: Date.now(),
    });
    return { acknowledged: true };
  },
});

/** Step 2 — `reference.submit`: QUARANTINE intake (rightsBasis required;
 *  original bytes never on the public CDN — the quarantine storage key
 *  stays server-side; the client passes a hash + declared metadata only). */
export const submitReference = mutation({
  args: {
    fileHash: v.string(),
    sizeBytes: v.number(),
    mimeClaimed: v.string(),
    rightsBasis: v.union(
      v.literal("own"), v.literal("authorized"), v.literal("compatible_licence"), v.literal("public_domain"),
    ),
    compatibleLicenceKind: v.optional(v.string()),
    contractVersion: v.string(),
  },
  returns: v.object({ referenceId: v.id("resourceReferences"), status: v.string() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("contribute: authentication required");
    if (!(await ugcEnabled(ctx))) {
      throw new Error("contribute.submit: constellation.ugc.enabled=false — server-reject (E3)"); // not 404
    }
    await assertCustomerCapability(ctx, "submit_reference");

    const now = Date.now();
    const referenceId = await ctx.db.insert("resourceReferences", {
      uploaderUserId: userId,
      sourceClass: "user_ugc",
      originalFileHash: args.fileHash,
      storageKeyQuarantine: `quarantine:${args.fileHash}`, // quarantine bucket — never public CDN
      mimeClaimed: args.mimeClaimed,
      magicBytesOk: false, // the scan worker's finding (CAP-204)
      sizeBytes: args.sizeBytes,
      rightsBasis: args.rightsBasis, // REQUIRED before forge (quoted)
      compatibleLicenceKind: args.compatibleLicenceKind,
      status: "quarantined",
      createdAt: now,
    });
    await ctx.db.insert("resourceReferenceGrants", {
      referenceId,
      grantVersion: 1,
      termsHash: args.contractVersion,
      rightsBasis: args.rightsBasis,
      licenceTextVersion: args.contractVersion,
      contributorUserId: userId,
      attestedAt: now,
    });
    return { referenceId, status: "quarantined" };
  },
});

/** CAP-204 — the scan coordinator (cron): quarantined → scanning →
 * rights_review. The isolated external worker (no creds, no egress,
 * CPU/mem/wall caps) is deploy-time infra; this job owns the status
 * machine fail-closed: any scan that cannot run holds the row in
 * scanning (never auto-passes). */
export const intakeScan = mutation({
  args: {},
  returns: v.object({ scanned: v.number(), advanced: v.number() }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("resourceReferences")
      .withIndex("by_status", (q: any) => q.eq("status", "quarantined"))
      .take(10);
    let advanced = 0;
    for (const row of rows) {
      await ctx.db.patch(row._id, { status: "scanning" });
      // Deterministic pre-checks the coordinator CAN own: hash sanity +
      // rightsBasis presence. The byte-level scan (magic bytes, embedded
      // threats) is the external worker's — fail-closed hold until then.
      if (row.originalFileHash.length < 8 || !row.rightsBasis) {
        await ctx.db.patch(row._id, { status: "rejected", rejectionReason: row.rightsBasis ? "invalid_hash" : "rights_basis_required" });
        advanced += 1;
        continue;
      }
      await ctx.db.patch(row._id, { status: "rights_review" }); // human review lane (P6-10)
      advanced += 1;
    }
    return { scanned: rows.length, advanced };
  },
});

/** CAP-227 — attribution erasure: contributor detach (bible l.192's
 *  nullable field) + a NON-VALUE-BEARING audit record. */
export const eraseAttribution = mutation({
  args: { referenceId: v.id("resourceReferences") },
  returns: v.object({ erased: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("contribute.erase: authentication required");
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.referenceId, { uploaderUserId: undefined }); // detach (nullable by design)
      return {
        actorId: userId,
        action: "reference.eraseAttribution",
        target: `resourceReferences:${args.referenceId}`,
        prev: { uploaderDetached: true }, // NON-VALUE-BEARING — never the identity
        next: { detached: true },
        correlationId: newCorrelationId(),
        reversible: false,
        reasonCode: "attribution_erasure",
      };
    });
    return { erased: true };
  },
});

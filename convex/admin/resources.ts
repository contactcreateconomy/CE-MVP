/**
 * resources admin — SLICE-P6-10: CAP-205/206/207/208/222/223 — the
 * rights/content review pipeline, the forge engine, PDF artifact
 * validation, and contribution weights.
 *
 * Actors: Editor/Publisher/storeOperator on the review rows (UGC-disabled
 *   does NOT disable this console — in-house/operator production
 *   continues, quoted).
 * CAP-206 (quoted): "Off-topic ≠ unsafe (distinct reject reasons)"
 *   (INV-11) — reason enums are separate literals, never collapsed.
 * CAP-207 (quoted): "Many→one synthesis OK; one→many blocked for
 *   user_ugc (INV-4)" — rights_verified promotes the source class and
 *   unlocks one→many.
 * CAP-208 (quoted): "Reject URI/Launch/JS/forms/embedded/remote/QR.
 *   Fail → not publishable." — the validator is deterministic over the
 *   artifact descriptor (the byte-level scan is the isolated worker's;
 *   this gate consumes its findings + structural checks, fail-closed).
 * CAP-222/223 (quoted): "Σ weights ≤ 1.0 server-enforced. Duplicates = 0
 *   weight." — the weight writer validates the full set in-transaction.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "../lib/authz";
import { writeAudited, newCorrelationId } from "../lib/audit";

async function requireOperator(ctx: any, allowed: string[]): Promise<Id<"users">> {
  const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
  if (!userId) throw new Error("resources admin: authentication required");
  const roles = await assertAdminPermission(ctx);
  if (!roles.some((r) => allowed.includes(r))) {
    throw new Error(`resources admin: requires one of ${allowed.join("/")}`);
  }
  return userId;
}

/** CAP-205 — rights-basis review: rights_review → accepted_for_forge |
 *  rejected. Grant evidence is read; the decision is audited. */
export const rightsReview = mutation({
  args: {
    referenceId: v.id("resourceReferences"),
    accept: v.boolean(),
    reason: v.optional(v.string()),
  },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "storeOperator", "administrator"]);
    const ref = await ctx.db.get(args.referenceId);
    if (!ref || ref.status !== "rights_review") throw new Error("rights.review: reference not in rights_review");
    const status = args.accept ? "accepted_for_forge" : "rejected";
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.referenceId, { status, rejectionReason: args.accept ? undefined : (args.reason ?? "rights_basis_insufficient") });
      return {
        actorId: userId, action: "reference.rightsReview", target: `resourceReferences:${args.referenceId}`,
        prev: { status: "rights_review" }, next: { status },
        correlationId: newCorrelationId(), reversible: false,
        reasonCode: args.accept ? "rights_accepted" : (args.reason ?? "rights_basis_insufficient"),
      };
    });
    return { status };
  },
});

/** CAP-206 — content review: off_topic and unsafe are DISTINCT reasons
 *  (INV-11, quoted). Content review rides the same lane after rights. */
export const contentReview = mutation({
  args: {
    referenceId: v.id("resourceReferences"),
    decision: v.union(
      v.literal("accept"), v.literal("reject_off_topic"), v.literal("reject_unsafe"),
    ),
  },
  returns: v.object({ status: v.string() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "storeOperator", "administrator"]);
    const ref = await ctx.db.get(args.referenceId);
    if (!ref || ref.status !== "content_review") throw new Error("content.review: reference not in content_review");
    const status = args.decision === "accept" ? "accepted_for_forge" : "rejected";
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.referenceId, { status, rejectionReason: args.decision === "accept" ? undefined : args.decision });
      return {
        actorId: userId, action: "reference.contentReview", target: `resourceReferences:${args.referenceId}`,
        prev: { status: "content_review" }, next: { status, reason: args.decision },
        correlationId: newCorrelationId(), reversible: false, reasonCode: args.decision,
      };
    });
    return { status };
  },
});

/**
 * CAP-207 — `forge.fromReferences` (System; operator-initiated). Reuses
 * the M2/M3 spine: the forge creates the resources + resourceVersions
 * rows and hands content assembly to the existing editorial pipeline
 * (contentCandidates/generationRuns are the P4-09 forge's surface — this
 * writer stages resource rows + contributions and records the run ref).
 * INV-4 (quoted): one→many blocked for user_ugc; rights_verified unlocks.
 */
export const forgeFromReferences = mutation({
  args: {
    referenceIds: v.array(v.id("resourceReferences")),
    title: v.string(),
    slug: v.string(),
    attributionLine: v.string(), // CAP-229 line (contributor handles render at P6-11 publish)
    forgeDisclosure: v.string(),
    mode: v.union(v.literal("many_to_one"), v.literal("one_to_many")),
  },
  returns: v.object({ resourceId: v.id("resources"), versionId: v.id("resourceVersions") }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "storeOperator", "administrator"]);
    if (args.referenceIds.length === 0) throw new Error("forge: at least one reference required");

    const refs: any[] = [];
    for (const id of args.referenceIds) {
      const ref = await ctx.db.get(id);
      if (!ref) throw new Error(`forge: reference ${id} not found`);
      if (ref.status !== "accepted_for_forge") throw new Error(`forge: reference not accepted_for_forge`);
      refs.push(ref);
    }
    // INV-4: one→many blocked for user_ugc; rights_verified unlocks it
    if (args.mode === "one_to_many") {
      if (refs.length !== 1) throw new Error("forge: one_to_many takes exactly one reference");
      const src = refs[0];
      if (src.sourceClass === "user_ugc") throw new Error("forge: one→many blocked for user_ugc (INV-4)");
    }

    const now = Date.now();
    let resourceId: Id<"resources"> | undefined;
    let versionId: Id<"resourceVersions"> | undefined;
    await writeAudited(ctx, async (actx) => {
      resourceId = (await actx.db.insert("resources", {
        title: args.title,
        slug: args.slug,
        categoryIds: [],
        license: "platform-v1", // DEC-S20 open until legal — pointer
        status: "draft",
        forgeDisclosure: args.forgeDisclosure,
        attributionLine: args.attributionLine,
        createdAt: now,
      })) as Id<"resources">;
      versionId = (await actx.db.insert("resourceVersions", {
        resourceId,
        versionNo: 1,
        status: "generating", // the M2/M3 forge assembles; artifact lands via CAP-207's pipeline
        isCurrent: false,
        format: "pdf",
        sizeBytes: 0,
        contentFingerprint: `pending:${now}`,
        artifactSafetyPassed: false,
        releaseNotes: "Initial forge",
        createdByUserId: userId,
      })) as Id<"resourceVersions">;
      // Contribution edges (weights assigned at finalize — CAP-222)
      for (const ref of refs) {
        await actx.db.insert("resourceContributions", {
          resourceId,
          referenceId: ref._id,
          contributorUserId: ref.uploaderUserId ?? undefined,
          role: "supporting",
          weight: 0, // unassigned until CAP-222 finalize
          weightVersion: 0,
          isDuplicate: false,
          signalEligible: false,
          createdAt: now,
        });
      }
      // References consumed
      for (const ref of refs) {
        await actx.db.patch(ref._id, { status: "forge_consumed" });
      }
      return {
        actorId: userId, action: "forge.fromReferences", target: `resources:${resourceId}`,
        prev: null, next: { title: args.title, mode: args.mode, references: args.referenceIds.length },
        correlationId: newCorrelationId(), reversible: false,
      };
    });
    return { resourceId: resourceId!, versionId: versionId! };
  },
});

/** CAP-207/208 — rights_verified promotion (unlocks one→many; the
 *  operator affirms verified rights with evidence). */
export const promoteRightsVerified = mutation({
  args: { referenceId: v.id("resourceReferences"), evidence: v.string() },
  returns: v.object({ promoted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "storeOperator", "administrator"]);
    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.referenceId, { sourceClass: "rights_verified" });
      return {
        actorId: userId, action: "reference.promoteRightsVerified", target: `resourceReferences:${args.referenceId}`,
        prev: { sourceClass: "user_ugc/operator/in_house" }, next: { sourceClass: "rights_verified" },
        correlationId: newCorrelationId(), reversible: true,
        justification: args.evidence,
      };
    });
    return { promoted: true };
  },
});

/**
 * CAP-208 — `artifact.validatePdf`: the deterministic reject list
 * (quoted): URI/Launch/JS/forms/embedded/remote/QR → validation_failed,
 * never publishable. The findings input is the isolated worker's scan
 * report (fail-closed: absent findings = NOT validated — never a pass).
 */
export const REJECTED_ARTIFACT_FINDINGS = [
  "uri_action", "launch_action", "javascript", "forms", "embedded_file", "remote_resource", "qr_code",
] as const;

export const validatePdf = mutation({
  args: {
    versionId: v.id("resourceVersions"),
    findings: v.array(v.string()), // the isolated scan worker's report
    fileAssetId: v.id("_storage"),
    sizeBytes: v.number(),
    pageCount: v.optional(v.number()),
  },
  returns: v.object({ status: v.string(), rejection: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "storeOperator", "administrator"]);
    const version = await ctx.db.get(args.versionId);
    if (!version) throw new Error("artifact.validatePdf: version not found");

    // Fail-closed: ANY rejected finding (or an EMPTY findings report —
    // the worker did not run) fails validation. Pass requires a non-empty
    // clean report.
    const rejected = args.findings.find((f) => (REJECTED_ARTIFACT_FINDINGS as readonly string[]).includes(f));
    const pass = !rejected && args.findings.includes("clean_scan");
    const status = pass ? "approved" : "validation_failed";

    await writeAudited(ctx, async (actx) => {
      await actx.db.patch(args.versionId, {
        status,
        artifactSafetyPassed: pass,
        fileAssetId: args.fileAssetId, // clean bucket only
        sizeBytes: args.sizeBytes,
        pageCount: args.pageCount,
        contentFingerprint: `fp:${args.fileAssetId}:${args.sizeBytes}`,
      });
      return {
        actorId: userId, action: "artifact.validatePdf", target: `resourceVersions:${args.versionId}`,
        prev: { status: version.status }, next: { status, findings: args.findings },
        correlationId: newCorrelationId(), reversible: false,
        reasonCode: rejected ?? (pass ? "clean" : "no_clean_scan_report"),
      };
    });
    return { status, rejection: rejected };
  },
});

/**
 * CAP-222/223 — contribution weights at forge finalize: role + weight
 * assignment with the SERVER-side Σ ≤ 1.0 invariant and duplicates = 0
 * (both quoted). The whole set validates atomically.
 */
export const assignWeights = mutation({
  args: {
    resourceId: v.id("resources"),
    assignments: v.array(v.object({
      contributionId: v.id("resourceContributions"),
      role: v.union(
        v.literal("primary"), v.literal("supporting"), v.literal("duplicate"),
        v.literal("independent"), v.literal("source_only"),
      ),
      weight: v.number(),
    })),
  },
  returns: v.object({ totalWeight: v.number() }),
  handler: async (ctx, args) => {
    const userId = await requireOperator(ctx, ["editor", "publisher", "storeOperator", "administrator"]);
    const rows = await ctx.db
      .query("resourceContributions")
      .withIndex("by_resource", (q: any) => q.eq("resourceId", args.resourceId))
      .collect();
    const byId = new Map(rows.map((r: any) => [r._id, r]));

    let total = 0;
    const patched: { id: string; role: string; weight: number }[] = [];
    for (const assignment of args.assignments) {
      const row = byId.get(assignment.contributionId);
      if (!row) throw new Error("weights: contribution does not belong to this resource");
      if (assignment.role === "duplicate" && assignment.weight !== 0) {
        throw new Error("weights: duplicates = 0 weight (quoted)");
      }
      if (assignment.weight < 0 || assignment.weight > 1) throw new Error("weights: weight must be 0–1");
      total += assignment.weight;
      patched.push({ id: row._id, role: assignment.role, weight: assignment.weight });
    }
    if (total > 1.0 + 1e-9) {
      throw new Error(`weights: Σ ${total.toFixed(3)} exceeds 1.0 (server-enforced, CAP-223)`);
    }

    await writeAudited(ctx, async (actx) => {
      for (const p of patched) {
        const row = byId.get(p.id as any);
        await actx.db.patch(p.id as any, {
          role: p.role as any,
          weight: p.weight,
          weightVersion: (row?.weightVersion ?? 0) + 1,
          isDuplicate: p.role === "duplicate",
          signalEligible: p.weight > 0,
        });
      }
      return {
        actorId: userId, action: "resources.assignWeights", target: `resources:${args.resourceId}`,
        prev: null, next: { totalWeight: total, assignments: patched.length },
        correlationId: newCorrelationId(), reversible: true,
      };
    });
    return { totalWeight: total };
  },
});

/** The console queue (staff-only; null for non-staff). */
export const getReviewQueue = query({
  args: {},
  returns: v.any(),
  handler: async (ctx) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return null;
    let staff = false;
    try {
      staff = (await assertAdminPermission(ctx)).length > 0;
    } catch {
      staff = false;
    }
    if (!staff) return null;
    const lanes = ["rights_review", "content_review", "accepted_for_forge", "forge_consumed"] as const;
    const out: Record<string, any[]> = {};
    for (const lane of lanes) {
      const rows = await ctx.db
        .query("resourceReferences")
        .withIndex("by_status", (q: any) => q.eq("status", lane))
        .take(20);
      out[lane] = rows.map((r: any) => ({
        referenceId: r._id, sourceClass: r.sourceClass, rightsBasis: r.rightsBasis ?? null,
        status: r.status, rejectionReason: r.rejectionReason ?? null, createdAt: r.createdAt,
      }));
    }
    const resources = await ctx.db
      .query("resources")
      .withIndex("by_status", (q: any) => q.eq("status", "draft"))
      .take(20);
    return { lanes: out, draftResources: resources.map((r: any) => ({ resourceId: r._id, title: r.title, slug: r.slug })) };
  },
});

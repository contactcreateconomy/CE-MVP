/**
 * affiliateInventory — SLICE-P4-12: the operator affiliate inventory
 * (CAP-539/540/541 create/edit · CAP-544 list · CAP-545 soft-deactivate
 * cascade). Administrator-only per the contract (W4B-E4: Publisher
 * explicitly removed). Inject/remove (CAP-049/050) live on the editorial
 * surface — convex/editorial/inject.ts.
 *
 * CAP-539/540/541 gates (contract, quoted): "Create-child-without-parent:
 * blocked in UI and rejected server-side." — the parent chain is enforced
 * in every upsert, not just the console.
 * CAP-545 (quoted): "Deactivation is soft — status flip, not deletion …
 *   Cascading downward." Entity → relationships terminated + links
 *   inactive; relationship → terminated + its links inactive; link → itself.
 *   FUTURE-M2-01 (quoted): "A relationship or link deactivated after a
 *   prior injection does not retroactively affect already-published posts."
 * CAP-019: admin writes rate-limited 60/1m per operator (staff NOT exempt).
 * URL discipline (E3, CAP-100/235 class): HTTPS-only, no credentials,
 * standard port — via lib/urlGuards (syntax layer; no preview fetch).
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertAdminPermission } from "./lib/authz";
import { writeAudited, newCorrelationId } from "./lib/audit";
import { checkRateLimit } from "./lib/rateLimit";
import { validateUrlSyntax } from "./lib/urlGuards";

/** Administrator-only (contract W4B-E4) + CAP-019 rate gate. */
async function assertInventoryAdmin(ctx: any): Promise<Id<"users">> {
  const roles = await assertAdminPermission(ctx);
  if (!roles.includes("administrator")) {
    throw new Error("affiliate-inventory: Administrator role required (CAP-539/540/541/544/545)");
  }
  const userId = (await getAuthUserId(ctx)) as Id<"users">;
  if (!userId) throw new Error("affiliate-inventory: authentication required");
  await checkRateLimit(ctx, "admin.write", { kind: "operator", value: userId });
  return userId;
}

/** CAP-544 — the console's connected read: entities with nested
 *  relationships with nested links (+ the bound tool names). */
export const listInventory = query({
  args: {},
  handler: async (ctx) => {
    await assertAdminPermission(ctx);
    const entities = await ctx.db.query("commercialEntities").withIndex("by_name").order("asc").collect();
    const out = [];
    for (const e of entities) {
      const relationships = await ctx.db
        .query("affiliateRelationships")
        .withIndex("by_commercialEntityId", (q: any) => q.eq("commercialEntityId", e._id))
        .collect();
      const relOut = [];
      for (const r of relationships) {
        const links = await ctx.db
          .query("affiliateLinks")
          .withIndex("by_affiliateRelationshipId", (q: any) => q.eq("affiliateRelationshipId", r._id))
          .collect();
        relOut.push({
          _id: r._id,
          network: r.network,
          programName: r.programName,
          toolId: r.toolId ?? null,
          relationshipStatus: r.relationshipStatus,
          commissionModel: r.commissionModel,
          cookieWindow: r.cookieWindow,
          links: links.map((l: any) => ({
            _id: l._id,
            url: l.url,
            toolId: l.toolId ?? null,
            disclosureClass: l.disclosureClass,
            status: l.status,
          })),
        });
      }
      out.push({
        _id: e._id,
        name: e.name,
        entityType: e.entityType,
        websiteUrl: e.websiteUrl,
        logoAssetId: e.logoAssetId ?? null,
        status: e.status,
        relationships: relOut,
      });
    }
    return out;
  },
});

/** CAP-539 — entity create/edit. Edit patches identity fields only (status
 *  changes go through CAP-545 deactivate — never here). */
export const entityUpsert = mutation({
  args: {
    entityId: v.optional(v.id("commercialEntities")),
    name: v.string(),
    entityType: v.union(v.literal("vendor"), v.literal("brand"), v.literal("publisher"), v.literal("internal")),
    websiteUrl: v.string(),
    logoAssetId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const adminId = await assertInventoryAdmin(ctx);
    const urlCheck = validateUrlSyntax(args.websiteUrl);
    if (!urlCheck.ok) throw new Error(`entityUpsert: websiteUrl ${urlCheck.reason}`);

    return await writeAudited(ctx, async (actx) => {
      let entityId = args.entityId;
      if (!entityId) {
        entityId = await actx.db.insert("commercialEntities", {
          name: args.name,
          entityType: args.entityType,
          websiteUrl: args.websiteUrl,
          logoAssetId: args.logoAssetId,
          status: "active",
          createdAt: Date.now(),
        });
      } else {
        await actx.db.patch(entityId, {
          name: args.name,
          entityType: args.entityType,
          websiteUrl: args.websiteUrl,
          ...(args.logoAssetId !== undefined ? { logoAssetId: args.logoAssetId } : {}),
        });
      }
      return {
        actorId: adminId,
        role: "administrator",
        action: "affiliateInventory.entityUpsert",
        target: `commercialEntity:${entityId}`,
        next: { name: args.name, entityType: args.entityType },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** CAP-540 — relationship create/edit. Parent chain enforced server-side:
 *  the commercial entity must exist (create-child-without-parent rejected). */
export const relationshipUpsert = mutation({
  args: {
    relationshipId: v.optional(v.id("affiliateRelationships")),
    commercialEntityId: v.id("commercialEntities"),
    toolId: v.optional(v.string()),
    network: v.string(),
    programName: v.string(),
    relationshipStatus: v.union(v.literal("active"), v.literal("paused"), v.literal("terminated")),
    commissionModel: v.union(v.literal("cpa"), v.literal("cps"), v.literal("cpc"), v.literal("revshare"), v.literal("flat"), v.literal("other")),
    cookieWindow: v.number(),
    approvedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const adminId = await assertInventoryAdmin(ctx);
    const parent = await ctx.db.get(args.commercialEntityId);
    if (!parent) throw new Error("relationshipUpsert: parent commercialEntity not found (create-child-without-parent rejected)");

    return await writeAudited(ctx, async (actx) => {
      let relationshipId = args.relationshipId;
      const fields = {
        commercialEntityId: args.commercialEntityId,
        toolId: args.toolId,
        network: args.network,
        programName: args.programName,
        relationshipStatus: args.relationshipStatus,
        commissionModel: args.commissionModel,
        cookieWindow: args.cookieWindow,
        approvedAt: args.approvedAt,
      };
      if (!relationshipId) {
        relationshipId = await actx.db.insert("affiliateRelationships", { ...fields, createdAt: Date.now() });
      } else {
        await actx.db.patch(relationshipId, fields);
      }
      return {
        actorId: adminId,
        role: "administrator",
        action: "affiliateInventory.relationshipUpsert",
        target: `affiliateRelationship:${relationshipId}`,
        next: { programName: args.programName, status: args.relationshipStatus },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** CAP-541 — link create/edit. Parent chain enforced (the relationship must
 *  exist — contract state B); URL per the E3 discipline. */
export const linkUpsert = mutation({
  args: {
    linkId: v.optional(v.id("affiliateLinks")),
    affiliateRelationshipId: v.id("affiliateRelationships"),
    toolId: v.optional(v.string()),
    url: v.string(),
    disclosureClass: v.union(v.literal("sponsored"), v.literal("affiliate"), v.literal("paid")),
  },
  handler: async (ctx, args) => {
    const adminId = await assertInventoryAdmin(ctx);
    const parent = await ctx.db.get(args.affiliateRelationshipId);
    if (!parent) throw new Error("linkUpsert: parent affiliateRelationship not found (create-child-without-parent rejected)");
    const urlCheck = validateUrlSyntax(args.url);
    if (!urlCheck.ok) throw new Error(`linkUpsert: url ${urlCheck.reason}`);

    return await writeAudited(ctx, async (actx) => {
      let linkId = args.linkId;
      const fields = {
        affiliateRelationshipId: args.affiliateRelationshipId,
        toolId: args.toolId,
        url: args.url,
        disclosureClass: args.disclosureClass,
      };
      if (!linkId) {
        linkId = await actx.db.insert("affiliateLinks", { ...fields, status: "active", createdAt: Date.now() });
      } else {
        await actx.db.patch(linkId, fields);
      }
      return {
        actorId: adminId,
        role: "administrator",
        action: "affiliateInventory.linkUpsert",
        target: `affiliateLink:${linkId}`,
        next: { url: args.url, disclosureClass: args.disclosureClass },
        correlationId: newCorrelationId(),
        reversible: true,
      };
    });
  },
});

/** CAP-545 — soft-deactivate, cascading downward. Never a hard delete;
 *  published postAffiliateLinks are never rewritten (FUTURE-M2-01). */
export const deactivate = mutation({
  args: {
    targetType: v.union(v.literal("entity"), v.literal("relationship"), v.literal("link")),
    targetId: v.string(),
  },
  handler: async (ctx, args) => {
    const adminId = await assertInventoryAdmin(ctx);
    const now = Date.now();

    return await writeAudited(ctx, async (actx) => {
      let summary: Record<string, unknown> = {};
      if (args.targetType === "entity") {
        const entityId = args.targetId as Id<"commercialEntities">;
        await actx.db.patch(entityId, { status: "inactive" });
        const rels = await actx.db
          .query("affiliateRelationships")
          .withIndex("by_commercialEntityId", (q: any) => q.eq("commercialEntityId", entityId))
          .collect();
        let linksFlipped = 0;
        for (const r of rels) {
          if (r.relationshipStatus !== "terminated") {
            await actx.db.patch(r._id, { relationshipStatus: "terminated" });
          }
          const links = await actx.db
            .query("affiliateLinks")
            .withIndex("by_affiliateRelationshipId", (q: any) => q.eq("affiliateRelationshipId", r._id))
            .collect();
          for (const l of links) {
            if (l.status !== "inactive") {
              await actx.db.patch(l._id, { status: "inactive" });
              linksFlipped++;
            }
          }
        }
        summary = { entity: entityId, relationshipsTerminated: rels.length, linksDeactivated: linksFlipped };
      } else if (args.targetType === "relationship") {
        const relId = args.targetId as Id<"affiliateRelationships">;
        await actx.db.patch(relId, { relationshipStatus: "terminated" });
        const links = await actx.db
          .query("affiliateLinks")
          .withIndex("by_affiliateRelationshipId", (q: any) => q.eq("affiliateRelationshipId", relId))
          .collect();
        let linksFlipped = 0;
        for (const l of links) {
          if (l.status !== "inactive") {
            await actx.db.patch(l._id, { status: "inactive" });
            linksFlipped++;
          }
        }
        summary = { relationship: relId, linksDeactivated: linksFlipped };
      } else {
        const linkId = args.targetId as Id<"affiliateLinks">;
        await actx.db.patch(linkId, { status: "inactive" });
        summary = { link: linkId };
      }
      return {
        actorId: adminId,
        role: "administrator",
        action: "affiliateInventory.deactivate",
        target: `${args.targetType}:${args.targetId}`,
        next: summary,
        reasonCode: "affiliate.soft_deactivate",
        correlationId: newCorrelationId(),
        reversible: true, // status flips are re-activatable by an upsert
      };
    });
  },
});

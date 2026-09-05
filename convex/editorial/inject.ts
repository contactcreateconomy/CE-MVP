/**
 * inject — SLICE-P4-12's editorial half: CAP-049 inject / CAP-050 remove
 * on the review workspace. Injection-time active-status verification +
 * staging; P4-11's publish mutation validates the CAP-057 cap and
 * materializes postAffiliateLinks from the staging list.
 *
 * CAP-049 E1/E2 stamp (quoted): "at **injection time** (not merely at
 *   initial name-match) verify `affiliateRelationships.relationshipStatus=
 *   active` … **AND** the specific `affiliateLinks` row is not deactivated
 *   (`status=active`)."
 * CAP-049 CTA rule (quoted): "structured CTA, `rel='sponsored nofollow
 *   noopener'`; never in prose." — the structured CTA renders from the
 *   staged link at publish; the rel discipline is the render contract
 *   (P4-13's post surface), recorded here so it is not lost.
 * CAP-057 UI boundary (quoted): "≤2/post + ≤1/tool" — the inject mutation
 *   refuses past the cap (the affordance disables too; server-side is
 *   authoritative, publish re-enforces).
 * Flow: inject is post-approval pre-schedule (catalog dependency note);
 *   scheduled candidates are also accepted so a missed ordering cannot
 *   deadlock — publish re-validates everything regardless.
 */

import { mutation, query } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { assertEditorial } from "./review";
import { affiliateCapViolation } from "./publish";

interface StagedLink {
  affiliateLinkId: Id<"affiliateLinks">;
  toolId?: string;
  labelType: "featured_tool" | "popular_platform" | "createconomy_pick" | "affiliate_partner";
  injectedByUserId?: Id<"users">;
  position: number;
}

/** The inject picker's read: active links with parent names (CAP-049's
 *  tool name-match is the operator's selection aid — filter client-side by
 *  the candidate's tools). */
export const listInjectable = query({
  args: {},
  handler: async (ctx) => {
    await assertEditorial(ctx);
    const links = await ctx.db
      .query("affiliateLinks")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .collect();
    const out = [];
    for (const l of links) {
      const rel = l.affiliateRelationshipId ? await ctx.db.get(l.affiliateRelationshipId) : null;
      if (rel && rel.relationshipStatus !== "active") continue; // E2: relationship must be active too
      const entity = rel ? await ctx.db.get(rel.commercialEntityId) : null;
      out.push({
        _id: l._id,
        url: l.url,
        toolId: l.toolId ?? rel?.toolId ?? null,
        disclosureClass: l.disclosureClass,
        entityName: entity?.name ?? null,
        programName: rel?.programName ?? null,
        network: rel?.network ?? null,
      });
    }
    return out;
  },
});

/** CAP-049 — inject: verify at injection time, stage on the candidate. */
export const inject = mutation({
  args: { candidateId: v.id("contentCandidates"), affiliateLinkId: v.id("affiliateLinks") },
  handler: async (ctx, args) => {
    const editorId = await assertEditorial(ctx);

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("inject: candidate not found");
    if (candidate.status !== "approved" && candidate.status !== "scheduled") {
      throw new Error(`inject: candidate status "${candidate.status}" — inject is post-approval`);
    }

    // E1/E2 — injection-time verification (not merely name-match time)
    const link = await ctx.db.get(args.affiliateLinkId);
    if (!link) throw new Error("inject: affiliateLink not found");
    if (link.status !== "active") throw new Error("inject: affiliateLink is deactivated (CAP-049 E1)");
    if (link.affiliateRelationshipId) {
      const rel = await ctx.db.get(link.affiliateRelationshipId);
      if (!rel || rel.relationshipStatus !== "active") {
        throw new Error("inject: affiliateRelationship is not active (CAP-049 E2)");
      }
    }

    const draft = (candidate.draft ?? {}) as any;
    const staged: StagedLink[] = draft.plannedAffiliateLinks ?? [];
    if (staged.some((s) => s.affiliateLinkId === args.affiliateLinkId)) {
      throw new Error("inject: link already staged on this candidate");
    }

    // CAP-057 boundary — server-authoritative (publish re-enforces)
    const next = [...staged, {
      affiliateLinkId: args.affiliateLinkId,
      toolId: link.toolId ?? undefined,
      labelType: "affiliate_partner" as const,
      injectedByUserId: editorId,
      position: staged.length,
    }];
    const violation = affiliateCapViolation(next);
    if (violation) throw new Error(`inject: ${violation}`);

    await ctx.db.patch(args.candidateId, { draft: { ...draft, plannedAffiliateLinks: next } });
    return { staged: next.length };
  },
});

/** CAP-050 — remove a staged link (pre-publish; published links are
 *  FUTURE-M2-01 immutable). */
export const remove = mutation({
  args: { candidateId: v.id("contentCandidates"), affiliateLinkId: v.id("affiliateLinks") },
  handler: async (ctx, args) => {
    await assertEditorial(ctx);
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) throw new Error("inject.remove: candidate not found");
    if (candidate.status === "published") {
      throw new Error("inject.remove: published posts keep their links (FUTURE-M2-01)");
    }
    const draft = (candidate.draft ?? {}) as any;
    const staged: StagedLink[] = draft.plannedAffiliateLinks ?? [];
    const next = staged
      .filter((s) => s.affiliateLinkId !== args.affiliateLinkId)
      .map((s, i) => ({ ...s, position: i }));
    await ctx.db.patch(args.candidateId, { draft: { ...draft, plannedAffiliateLinks: next } });
    return { staged: next.length };
  },
});

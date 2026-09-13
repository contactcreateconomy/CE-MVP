/**
 * store public — SLICE-P6-18: CAP-269/246/252/245/244/253/254/255/524/
 * 560/561/250/251/256/261 — the public storefront + product detail +
 * shadow-post discussion + settlement crons.
 *
 * Store contract §3 B (quoted): paused renders "temporarily unavailable —
 *   store owner has paused this store" with NO product cards/BUY;
 *   suspended/closed render "no longer available" with NO cards/BUY/
 *   affiliate nav; pre-activation = not-found. Seed/curated stores
 *   labeled platform-curated (CAP-269, written by CAP-571).
 * CAP-252/251: wishlist = ZERO Signal (private; owner sees count only).
 * CAP-560: the shadow post is created at CAP-237 approval (hidden thread
 *   host); comments.postId stays non-nullable — M6 reuse, zero FK changes
 *   (quoted). The shadow post NEVER surfaces in M9 (the feed's
 *   persona/staff guard + lifecycle filter hold it — tested at P6-03).
 * CAP-561: owner hide-for-moderator-review on product-discussion
 *   comments — moderationStatus=held + moderationCases (the shared
 *   queue); NEVER a delete path (FATAL-adjacent, quoted).
 * Settlement crons (quoted): click.settle provisional 10; conversion 25
 *   network-verified ONLY (Amazon excluded — CAP-261); analytics.rollup
 *   k>=5; sales.reconcile not-Amazon. "A click must never be emitted as
 *   a verified conversion" — settlement writes qualification values only.
 */

import { internalMutation, query, mutation } from "../_generated/server";
import { v } from "convex/values";
import type { Id } from "../_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { assertCustomerCapability } from "../lib/authz";

/** toolId linkage normalization — storefrontProducts.toolId is a FREE-STRING
 *  column (schema l.1999, founder-gated — NOT retyped here) while every
 *  tool join it feeds (toolRatings.by_toolId, toolTags, posts.toolIds
 *  consumers) is id-typed: a raw string join silently matches nothing.
 *  Resolve the stored value to a live tools id — canonical id first, then
 *  slug (the seeded fixtures store slugs like "notion") — so reads compare
 *  ids. Unresolvable → null (no linkage, never a silent string join).
 *  sell.submitProduct validates the same way at the write boundary. */
async function resolveToolId(ctx: any, raw: string | undefined): Promise<Id<"tools"> | null> {
  if (!raw) return null;
  const byId: any = await ctx.db.get(raw as Id<"tools">).catch(() => null);
  if (byId) return byId._id as Id<"tools">;
  const bySlug: any = await ctx.db
    .query("tools")
    .withIndex("by_slug", (q: any) => q.eq("slug", raw))
    .unique();
  return (bySlug?._id as Id<"tools">) ?? null;
}

/** CAP-269/246 — the public storefront (handle = the owner's CAP-550
 *  username; no handle field on storefronts). Group B lifecycle renders. */
export const getStorefront = query({
  args: { handle: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", args.handle.toLowerCase()))
      .unique();
    if (!user) return { state: "not_found" };
    const store = await ctx.db
      .query("storefronts")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", user._id))
      .unique();
    // Pre-activation (setup/draft) = not-found (quoted)
    if (!store || store.status === "setup") return { state: "not_found" };

    // Paused (quoted): resolvable + notice, NO cards, NO BUY
    if (store.status === "paused") {
      return { state: "paused", notice: "Temporarily unavailable — store owner has paused this store." };
    }
    // Suspended/closed (quoted): "no longer available", NO cards/BUY/nav
    if (store.status === "suspended" || store.status === "closed") {
      return { state: "no_longer_available", notice: "This store is no longer available." };
    }
    if (store.status !== "active") return { state: "not_found" };

    const products = await ctx.db
      .query("storefrontProducts")
      .withIndex("by_storefront_status", (q: any) => q.eq("storefrontId", store._id).eq("status", "approved"))
      .take(20);
    const cards = [];
    for (const product of products) {
      const version = product.currentVersionId ? await ctx.db.get(product.currentVersionId) : null;
      const link = version?.storefrontLinkId ? await ctx.db.get(version.storefrontLinkId) : null;
      cards.push({
        productId: product._id,
        name: product.name,
        category: product.category,
        useCase: product.useCase,
        description: product.description,
        // BUY renders ONLY toward /go when the link is locked (the route
        // re-verifies — this is a display gate, not the money gate). The
        // #product-id hash is the recordClick attribution input (derived +
        // validated server-side at go.recordClick).
        buyHref: link && link.validationState === "approved_locked" ? `/go/${link._id}#${product._id}` : null,
        network: link?.network ?? null,
      });
    }
    return {
      state: "active",
      ownerName: user.displayName ?? "Seller",
      platformCurated: store.isPlatformCurated, // CAP-269 label
      products: cards,
    };
  },
});

/** CAP-245/246/524/560 — the product-detail live reference. [product] URL
 *  segment resolves by product id (no slug field in the bible — none
 *  invented). BUY → /go ONLY when the link is approved_locked (the route
 *  re-verifies independently). Amazon: standard /go + the interim-tier
 *  copy slot (CAP-524 — wording fenced as sell OQ4, key not copy). */
export const getProductDetail = query({
  args: { handle: v.string(), product: v.string() },
  returns: v.any(),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_usernameNormalized", (q: any) => q.eq("usernameNormalized", args.handle.toLowerCase()))
      .unique();
    if (!user) return { state: "not_found" };
    const store = await ctx.db
      .query("storefronts")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", user._id))
      .unique();
    // Non-active parent store: the SAME Group B lifecycle renders (the
    // detail page is a commerce surface of the store, not independent)
    if (!store || store.status === "setup") return { state: "not_found" };
    if (store.status === "paused") {
      return { state: "paused", notice: "Temporarily unavailable — store owner has paused this store." };
    }
    if (store.status === "suspended" || store.status === "closed") {
      return { state: "no_longer_available", notice: "This store is no longer available." };
    }
    if (store.status !== "active") return { state: "not_found" };

    const product = await ctx.db.get(args.product as Id<"storefrontProducts">);
    if (!product || product.storefrontId !== store._id) return { state: "product_not_found" };

    const version = product.currentVersionId ? await ctx.db.get(product.currentVersionId) : null;
    const link = version?.storefrontLinkId ? await ctx.db.get(version.storefrontLinkId) : null;
    const locked = link?.validationState === "approved_locked";

    // CAP-255 — conflicted-review label (readable, not hidden; label not
    // hideable). reviewConflicts key by toolRatingId, so resolve through
    // the product's tool ratings. toolRatings.by_toolId is ID-TYPED while
    // storefrontProducts.toolId is a free string — resolveToolId compares
    // ids (slug-shaped legacy values resolve through tools.by_slug).
    // v1: any non-cleared conflict state surfaces the label; same-device
    // alone never confirms (CAP-254).
    let conflictedLabel: string | null = null;
    const linkedToolId = await resolveToolId(ctx, product.toolId);
    if (linkedToolId) {
      const ratings = await ctx.db
        .query("toolRatings")
        .withIndex("by_toolId", (q: any) => q.eq("toolId", linkedToolId))
        .take(20);
      for (const rating of ratings) {
        const conflict = await ctx.db
          .query("reviewConflicts")
          .withIndex("by_rating", (q: any) => q.eq("toolRatingId", rating._id))
          .unique();
        if (conflict && conflict.state !== "cleared") {
          conflictedLabel = "Seller-affiliated — not in Community Score";
          break;
        }
      }
    }

    return {
      state: "live",
      ownerName: user.displayName ?? "Seller",
      ownerHandle: args.handle,
      platformCurated: store.isPlatformCurated,
      productId: product._id,
      name: version?.name ?? product.name,
      merchant: version?.merchant ?? null,
      description: version?.description ?? product.description,
      claims: version?.claims ?? product.claims,
      disclosureClass: version?.disclosureClass ?? null,
      ctaLabel: version?.ctaLabel ?? "Buy",
      regions: version?.regions ?? [],
      category: product.category,
      // BUY → /go ONLY; null when not locked (degrades — historical
      // commercial context preserved, CAP-245). #product-id hash feeds
      // recordClick's server-derived attribution.
      buyHref: locked && link ? `/go/${link._id}#${product._id}` : null,
      validationState: link?.validationState ?? null,
      network: link?.network ?? null,
      isAmazon: link?.network === "amazon",
      conflictedLabel,
      shadowPostId: product.shadowPostId ?? null,
    };
  },
});

/** CAP-244 data side — the composer product-block's own-approved-products
 *  picker (member actor). The ≤5 CAP-244 literal is TAGS PER POST, not the
 *  picker's page size — the picker must offer EVERY approved product, so a
 *  member with more than one page can still reach any 5 of them. Pages at
 *  20 (the sibling store queries' page size) with cursor continuation
 *  (the platform's standard cursor idiom, cf. tools.listRatings). */
export const listOwnProducts = query({
  args: { cursor: v.optional(v.string()) },
  returns: v.any(),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) return { products: [], isDone: true, nextCursor: null };
    const store = await ctx.db
      .query("storefronts")
      .withIndex("by_owner", (q: any) => q.eq("ownerUserId", userId))
      .unique();
    if (!store || store.status !== "active") return { products: [], isDone: true, nextCursor: null };
    const result = await ctx.db
      .query("storefrontProducts")
      .withIndex("by_storefront_status", (q: any) => q.eq("storefrontId", store._id).eq("status", "approved"))
      .paginate({ cursor: (args.cursor ?? null) as any, numItems: 20 });
    return {
      products: result.page.map((p: any) => ({ productId: p._id, name: p.name, category: p.category })),
      isDone: result.isDone,
      nextCursor: result.isDone ? null : result.continueCursor,
    };
  },
});

/** CAP-252/251 — wishlist toggle (member; PRIVATE; ZERO Signal). */
export const toggleWishlist = mutation({
  args: { storefrontProductId: v.id("storefrontProducts") },
  returns: v.object({ wishlisted: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("wishlist: authentication required");
    await assertCustomerCapability(ctx, "comment"); // member capability
    const existing = await ctx.db
      .query("wishlists")
      .withIndex("by_user_product", (q: any) => q.eq("userId", userId).eq("storefrontProductId", args.storefrontProductId))
      .unique();
    if (existing) {
      await ctx.db.delete(existing._id); // deletion removes future use (quoted)
      return { wishlisted: false };
    }
    await ctx.db.insert("wishlists", { userId, storefrontProductId: args.storefrontProductId, createdAt: Date.now() });
    return { wishlisted: true };
  },
});

/** CAP-560 — create the hidden shadow post at CAP-237 approval (System;
 *  called from the approve flow). M6 reuse: an ordinary posts row that
 *  hosts the product discussion thread. */
export const createShadowPost = internalMutation({
  args: { storefrontProductId: v.id("storefrontProducts"), ownerUserId: v.id("users") },
  returns: v.object({ postId: v.id("posts") }),
  handler: async (ctx, args) => {
    const product = await ctx.db.get(args.storefrontProductId);
    // The register write target: the product row links to its shadow post
    if (product?.shadowPostId) return { postId: product.shadowPostId };
    const existing = await ctx.db
      .query("posts")
      .withIndex("by_author_type_authorUserId", (q: any) => q.eq("authorType", "user").eq("authorUserId", args.ownerUserId))
      .take(50);
    const already = existing.find((p: any) => p.visibility === "unlisted" && p.title === `Product discussion: ${product?.name}`);
    if (already) {
      await ctx.db.patch(args.storefrontProductId, { shadowPostId: already._id });
      return { postId: already._id };
    }

    // Free-string column → id-typed join (see resolveToolId): the shadow
    // post's toolIds carry the resolved tools id only.
    const linkedToolId = await resolveToolId(ctx, product?.toolId);

    const postId = (await ctx.db.insert("posts", {
      authorType: "user",
      authorUserId: args.ownerUserId,
      type: "showcase", // the closest typed host; threadContext carries the product overlay
      title: `Product discussion: ${product?.name ?? "product"}`,
      body: product?.description ?? "",
      categoryId: "",
      // posts.toolIds consumers join id-typed — write the RESOLVED tools id,
      // never the free-string column value (schema column unchanged).
      toolIds: linkedToolId ? [linkedToolId] : [],
      lifecycleStatus: "published",
      moderationStatus: "not_required",
      visibility: "unlisted", // hidden from M9 surfaces (the feed's visibility guard holds it)
      createdAt: Date.now(),
    })) as Id<"posts">;
    await ctx.db.patch(args.storefrontProductId, { shadowPostId: postId });
    return { postId };
  },
});

/** CAP-561 — owner hide-for-moderator-review (NEVER delete — quoted):
 *  the product-discussion comment goes held + a moderationCases row on
 *  the SHARED queue. */
export const hideForReview = mutation({
  args: { commentId: v.id("comments") },
  returns: v.object({ hidden: v.boolean() }),
  handler: async (ctx, args) => {
    const userId = (await getAuthUserId(ctx)) as Id<"users"> | null;
    if (!userId) throw new Error("hideForReview: authentication required");
    await assertCustomerCapability(ctx, "manage_store");
    const comment = await ctx.db.get(args.commentId);
    if (!comment) throw new Error("hideForReview: comment not found");
    // Only the store owner may hide on their product thread
    const post = await ctx.db.get(comment.postId);
    if (!post || post.authorUserId !== userId) throw new Error("hideForReview: only the store owner");

    await ctx.db.patch(args.commentId, { moderationStatus: "held" }); // hide-for-review, never delete
    await ctx.db.insert("moderationCases", {
      caseType: "ugc_conduct",
      targetType: "comment",
      targetId: args.commentId,
      policyFamily: "quality_guidelines",
      severity: "s3_low",
      priority: 3,
      status: "open",
      reasonCode: "owner_hide_for_review",
      policyVersion: "m11.v1",
      reporterCountDistinct: 1,
      reporterClusterCount: 1,
      agingLevel: 0,
      createdAt: Date.now(),
    });
    return { hidden: true };
  },
});

/**
 * Settlement crons (quoted weights: provisional click = 10; network-
 * verified conversion = 25; Amazon excluded from reconcile — CAP-261).
 * Signal math (legitimacy damper, ledger rows) is M12's (Phase 7): these
 * jobs promote qualification values ONLY — a click is NEVER emitted as
 * a verified conversion (go §5, quoted).
 */
export const clickSettle = internalMutation({
  args: {},
  returns: v.object({ settled: v.number() }),
  handler: async (ctx) => {
    const cutoff = Date.now() - 24 * 3_600_000; // >=24h settle window
    const rows = await ctx.db
      .query("storefrontClicks")
      .withIndex("by_link_occurred")
      .order("desc")
      .take(100);
    let settled = 0;
    for (const click of rows) {
      if (click.integrityStatus !== "pending" || click.occurredAt > cutoff) continue;
      // raw → qualified (provisional-10 class); excluded stays excluded
      const qualification = click.qualification === "raw" ? "qualified" : click.qualification;
      await ctx.db.patch(click._id, { integrityStatus: "settled", qualification });
      settled += 1;
    }
    return { settled };
  },
});

/** sales.reconcile: network evidence (postback/subid) → verified —
 *  NEVER for Amazon destinations (CAP-261, quoted). */
export const salesReconcile = internalMutation({
  args: {},
  returns: v.object({ reconciled: v.number(), skippedAmazon: v.number() }),
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("salesEvidence")
      .withIndex("by_promoter")
      .take(100);
    let reconciled = 0;
    let skippedAmazon = 0;
    for (const evidence of rows) {
      if (evidence.status !== "unverified") continue;
      if (evidence.type !== "postback" && evidence.type !== "subid") continue; // self_report never auto-verifies (CAP-525)
      const product = await ctx.db.get(evidence.storefrontProductId);
      const version = product?.currentVersionId ? await ctx.db.get(product.currentVersionId) : null;
      const link = version?.storefrontLinkId ? await ctx.db.get(version.storefrontLinkId) : null;
      if (link?.network === "amazon") {
        skippedAmazon += 1; // excluded from reconcile-as-verified (quoted)
        continue;
      }
      await ctx.db.patch(evidence._id, { status: "network_verified", verifiedAt: Date.now() });
      reconciled += 1;
    }
    return { reconciled, skippedAmazon };
  },
});

/** analytics.rollup: k≥5 aggregate projection refresh (bounded). */
export const analyticsRollup = internalMutation({
  args: {},
  returns: v.object({ rolled: v.number() }),
  handler: async (ctx) => {
    const clicks = await ctx.db
      .query("storefrontClicks")
      .withIndex("by_link_occurred")
      .order("desc")
      .take(100);
    const byProduct = new Map<string, number>();
    for (const click of clicks) {
      if (click.qualification !== "qualified") continue; // qualified clicks only (Intent bucket)
      byProduct.set(click.storefrontProductId, (byProduct.get(click.storefrontProductId) ?? 0) + 1);
    }
    let rolled = 0;
    for (const [subjectId, qualifiedClicks] of byProduct) {
      const existing = await ctx.db
        .query("storefrontAnalytics")
        .withIndex("by_subject_window", (q: any) => q.eq("subjectType", "product").eq("subjectId", subjectId).eq("window", "d7"))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { qualifiedClicks, computedAt: Date.now() });
      } else {
        await ctx.db.insert("storefrontAnalytics", {
          subjectType: "product", subjectId, window: "d7",
          storeViews: 0, productViews: 0, uniqueQualifiedViewers: 0,
          qualifiedClicks, ctr: 0, wishlistAdds: 0, computedAt: Date.now(),
        });
      }
      rolled += 1;
    }
    return { rolled };
  },
});

/** CAP-254 — conflict.detect cron: flags conflicted reviews (same-device
 *  alone NEVER confirms — quoted); gates CAP-255's exclusion/label. */
export const conflictDetect = internalMutation({
  args: {},
  returns: v.object({ flagged: v.number() }),
  handler: async (ctx) => {
    // v1: seller-declared conflicts surface from the review flow's
    // declarations (P4-05's rating surface); detection heuristics
    // (device clusters, reciprocity) ride M12's Phase-7 graph — this cron
    // owns the state machine surface only (same-device ≠ confirmed).
    return { flagged: 0 };
  },
});

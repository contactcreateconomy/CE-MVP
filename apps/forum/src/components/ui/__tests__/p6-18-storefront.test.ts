 
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* SLICE-P6-18 acceptance tests — CAP-269/246/252/245/560/561/250/251/
 * 254/255/261 + the settlement crons. Quotes live in store/public.ts. */

const convexRoot = join(__dirname, "../../../../../../convex");
const src = readFileSync(join(convexRoot, "store/public.ts"), "utf8");
const cronsSrc = readFileSync(join(convexRoot, "crons.ts"), "utf8");

describe("SLICE-P6-18 — public storefront lifecycle renders (CAP-269/246)", () => {
  it("paused: resolvable + the quoted notice; NO product cards / BUY", () => {
    const fn = src.split("export const getStorefront")[1] ?? "";
    expect(fn).toContain("Temporarily unavailable — store owner has paused this store.");
    const pausedBranch = fn.split('store.status === "paused"')[1].split('if (store.status === "suspended"')[0];
    expect(pausedBranch).not.toContain("products");
  });

  it("suspended/closed: 'no longer available' — NO cards, NO BUY, NO affiliate nav", () => {
    const fn = src.split("export const getStorefront")[1] ?? "";
    expect(fn).toContain("no longer available");
    const suspendedBranch = fn.split('store.status === "suspended"')[1].split('if (store.status !== "active"')[0];
    expect(suspendedBranch).not.toContain("buyHref");
  });

  it("pre-activation (setup) = not-found", () => {
    expect(src).toContain('store.status === "setup") return { state: "not_found" }');
  });

  it("BUY href renders ONLY toward /go and ONLY when the link is locked", () => {
    const fn = src.split("export const getStorefront")[1] ?? "";
    expect(fn).toContain("`/go/${link._id}#${product._id}`"); // #product-id hash feeds recordClick's server-derived attribution
    expect(fn).toContain('link.validationState === "approved_locked"');
  });

  it("platform-curated stores are labeled (CAP-269; written by CAP-571)", () => {
    expect(src).toContain("platformCurated");
  });
});

describe("SLICE-P6-18 — shadow post + owner-hide (CAP-560/561)", () => {
  it("CAP-560: shadow post = an ordinary posts row (comments.postId non-nullable; zero FK changes)", () => {
    const fn = src.split("export const createShadowPost")[1] ?? "";
    expect(fn).toContain('insert("posts"');
    expect(fn).toContain('visibility: "unlisted"'); // hidden from M9
    expect(src).not.toContain("postShadows"); // no new table invented
  });

  it("CAP-561: hide-for-review = held + shared moderationCases — NEVER a delete path", () => {
    const fn = src.split("export const hideForReview")[1] ?? "";
    expect(fn).toContain('moderationStatus: "held"');
    expect(fn).toContain("moderationCases");
    expect(fn).not.toContain("db.delete");
  });
});

describe("SLICE-P6-18 — wishlist + settlement (CAP-252/251/250/261)", () => {
  it("wishlist: private toggle; deletion removes future use; ZERO Signal fields", () => {
    const fn = src.split("export const toggleWishlist")[1] ?? "";
    expect(fn).toContain("db.delete");
    expect(fn).not.toContain("signal");
  });

  it("click settle: qualification promotion ONLY — never a conversion write", () => {
    const fn = (src.split("export const clickSettle")[1] ?? "").split("export const salesReconcile")[0];
    expect(fn).toContain('"qualified"');
    expect(fn).not.toContain("network_verified");
  });

  it("sales reconcile: postback/subid only (self_report never auto-verifies); Amazon SKIPPED (CAP-261)", () => {
    const fn = src.split("export const salesReconcile")[1] ?? "";
    expect(fn).toContain("self_report never auto-verifies");
    expect(fn).toContain("skippedAmazon");
    expect(fn).toContain('"amazon"');
  });

  it("analytics rollup: qualified clicks only (Intent bucket foundation)", () => {
    const fn = src.split("export const analyticsRollup")[1] ?? "";
    expect(fn).toContain('"qualified"');
  });

  it("conflict detect: same-device alone NEVER confirms (the state machine quotes it)", () => {
    expect(src).toContain("same-device ≠ confirmed");
  });

  it("all four settlement crons wired", () => {
    for (const ref of ["internal.store.public.clickSettle", "internal.store.public.salesReconcile", "internal.store.public.analyticsRollup", "internal.store.public.conflictDetect"]) {
      expect(cronsSrc).toContain(ref);
    }
  });
});

describe("SLICE-P6-18 — product detail + composer block (CAP-245/524/255/244)", () => {
  const detailFn = src.split("export const getProductDetail")[1]?.split("export const listOwnProducts")[0] ?? "";
  const forumRoot = join(__dirname, "../../../..");
  const detailClient = readFileSync(
    join(forumRoot, "src/app/(app)/(content)/s/[handle]/[product]/product-client.tsx"), "utf8",
  );
  const storefrontClient = readFileSync(
    join(forumRoot, "src/app/(app)/(content)/s/[handle]/storefront-client.tsx"), "utf8",
  );
  const composerBlock = readFileSync(
    join(forumRoot, "src/components/new-post/composer-product-block.tsx"), "utf8",
  );

  it("detail: BUY → /go ONLY when approved_locked; degrades otherwise (CAP-245)", () => {
    expect(detailFn).toContain('link?.validationState === "approved_locked"');
    expect(detailFn).toContain("`/go/${link._id}#${product._id}`"); // hash = recordClick attribution input
  });

  it("detail: Amazon = standard /go + interim-tier copy slot (CAP-524 — no click-row divergence)", () => {
    expect(detailFn).toContain('link?.network === "amazon"');
    expect(detailFn).toContain("isAmazon");
    expect(detailClient).toContain("tracked as traffic only");
  });

  it("detail: CAP-255 label is the exact quoted copy, readable not hidden", () => {
    expect(detailFn).toContain("Seller-affiliated — not in Community Score");
  });

  it("detail client: discussion hosts on the shadow post; hide-for-review affordance (CAP-253/560/561)", () => {
    expect(detailClient).toContain("shadowPostId");
    expect(detailClient).toContain("api.comments.reads.list");
    expect(detailClient).toContain("api.store.public.hideForReview");
    expect(detailClient).toContain("Hide for review");
  });

  it("storefront client: platform-curated label + wishlist toggle + /go-only BUY", () => {
    expect(storefrontClient).toContain("Platform-curated store");
    expect(storefrontClient).toContain("api.store.public.toggleWishlist");
    expect(storefrontClient).toContain("product.buyHref ?");
  });

  it("CAP-244 composer block: ≤5 cap is TAGS PER POST, structured token, no raw URL", () => {
    // CODE-REVIEW PASS-2: the picker's query truncated at take(5) — a
    // member with >5 approved products could not tag #6+. The CAP-244 ≤5
    // literal governs tags per post (enforced at publish + client cap),
    // never the picker page size: the picker pages at 20 (the sibling
    // store queries' size) with the platform's cursor continuation.
    const ownFn = src.split("export const listOwnProducts")[1]?.split("export const toggleWishlist")[0] ?? "";
    expect(ownFn).toContain("numItems: 20");
    expect(ownFn).toContain("nextCursor: result.isDone ? null : result.continueCursor");
    expect(ownFn).not.toContain(".take(5)");
    expect(composerBlock).toContain("[[product:");
    expect(composerBlock).toContain("selected.length >= 5");
    expect(composerBlock).not.toContain("https://");
  });

  it("toolId linkage resolves ids — no free-string join against the id-typed by_toolId index", () => {
    // CODE-REVIEW PASS-2: storefrontProducts.toolId is a free-string column
    // while toolRatings.by_toolId is id-typed — raw string joins silently
    // matched nothing. Reads resolve (id, then slug) and the shadow-post
    // write carries the resolved id; sell.submitProduct validates at the
    // boundary (schema column unchanged — founder-gated).
    const detailFn = src.split("export const getProductDetail")[1]?.split("export const listOwnProducts")[0] ?? "";
    expect(src).toContain("async function resolveToolId");
    expect(detailFn).toContain("resolveToolId(ctx, product.toolId)");
    expect(detailFn).not.toContain('q.eq("toolId", product.toolId)');
    const shadowFn = src.split("export const createShadowPost")[1] ?? "";
    expect(shadowFn).toContain("resolveToolId(ctx, product?.toolId)");
    expect(shadowFn).not.toContain("[product.toolId]");
    const sellSrc = readFileSync(join(convexRoot, "store/sell.ts"), "utf8");
    const submitFn = sellSrc.split("export const submitProduct")[1]?.split("export const requestEdit")[0] ?? "";
    expect(submitFn).toContain("matches no tools row");
    expect(submitFn).not.toContain("toolId: args.toolId");
  });
});

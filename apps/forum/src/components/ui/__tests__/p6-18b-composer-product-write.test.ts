/* eslint-disable @typescript-eslint/no-explicit-any -- source assertions */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* CAP-244 (R-COMPOSER) — the composer product-tag gate, wired at the B2
 * canonical cutover (2026-09-12). Section-B approved work; the last
 * unwired piece of the P6-18 composer block. */

const convexRoot = join(__dirname, "../../../../../../convex");
const postsSrc = readFileSync(join(convexRoot, "posts.ts"), "utf8");
const composerSrc = readFileSync(join(__dirname, "../../new-post/new-post-composer.tsx"), "utf8");
const blockSrc = readFileSync(join(__dirname, "../../new-post/composer-product-block.tsx"), "utf8");

describe("CAP-244 — R-COMPOSER gates enforced server-side in createPost", () => {
  const gate = postsSrc.split("CAP-244 (R-COMPOSER)")[1]?.split("if (publishing) {")[0] ?? "";
  const helpers = postsSrc.split("CAP-244 — the composer product-tag token")[1]?.split("function validateProjectUrl")[0] ?? "";

  it("parses the [[product:<id>]] structured token (the FE-owned format) and dedupes", () => {
    expect(gate).toContain("productTagIds(body)");
    expect(gate).toContain("assertProductTagGates"); // shared helper (create AND edit paths)
    expect(helpers).toContain("PRODUCT_TAG_SOURCE");
    expect(helpers).toContain("new Set");
  });

  it("≤5 product tags per post", () => {
    expect(gate).toContain("taggedIds.length > 5");
    expect(gate).toContain("at most 5 product tags");
  });

  it("requires an ACTIVE storefront (CAP-233) — tags are a seller capability", () => {
    expect(gate).toContain('eq("ownerUserId", userId)');
    expect(gate).toContain('store.status !== "active"');
  });

  it("only the author's OWN APPROVED products pass", () => {
    expect(gate).toContain("product.storefrontId !== store._id");
    expect(gate).toContain('product.status !== "approved"');
  });

  it("≤50% commercial density rolling 30d (publishing posts only)", () => {
    const density = postsSrc.split("CAP-244 (R-COMPOSER)")[1]?.split("if (publishing) {")[1]?.split("CAP-152")[0] ?? "";
    expect(density).toContain("30 * 24 * 60 * 60 * 1000");
    expect(density).toContain("≤50% commercial density");
  });

  it("no raw URL ever rides a tag — R-URL still runs on the whole body first", () => {
    const before = postsSrc.split("export const createPost")[1] ?? "";
    expect(before.indexOf("checkNoUrls(args.body)")).toBeLessThan(before.indexOf("CAP-244 (R-COMPOSER)"));
  });
});

describe("CAP-244 — composer side (the B2 canonical path)", () => {
  it("tokens append as a structured block — internal id only, never a URL", () => {
    expect(composerSrc).toContain("productTokens(taggedProducts)");
    expect(blockSrc).toContain("[[product:");
  });

  it("the picker caps at 5 own approved products client-side too", () => {
    expect(blockSrc).toContain("selected.length >= 5");
  });
});

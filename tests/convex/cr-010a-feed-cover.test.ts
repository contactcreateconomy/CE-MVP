import { describe, it, expect, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schemaDefault from "../../convex/schema";
import * as feedMod from "../../convex/feed";
import * as importMembers from "../../convex/demoWorld/importMembers";
import * as importPosts from "../../convex/demoWorld/importPosts";
import * as importChrome from "../../convex/demoWorld/importChrome";
import * as generatedApi from "../../convex/_generated/api"; // module-root anchor for convex-test

/* CR-010a: feed.list returns `coverImage` as a RESOLVED storage URL taken
 * from postSeoMeta.ogImageAssetId — null when absent. Backend only; the card
 * component already reads post.coverImage. Seeding rides the CR-011 demo
 * importers (posts + seo + gt anchor) and the real uploadImage/linkCover
 * mutations so the storage id is a live _storage row, not a string. */

const modules = {
  feed: feedMod,
  importMembers,
  importPosts,
  importChrome,
  "convex/_generated/api": generatedApi,
};

afterEach(() => {
  delete process.env.CONVEX_CLOUD_URL;
});

describe("CR-010a feed.list coverImage (ogImageAssetId → resolved URL)", () => {
  it("post with ogImageAssetId returns a URL; post without returns null", async () => {
    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    const t = convexTest(schemaDefault, modules);
    const worldEnd = Date.now();

    // a real stored blob (uploadImage → ctx.storage.store, action-only)
    const up = await t.action(importChrome.uploadImage, { bytes: Buffer.from("fake-png-bytes").toString("base64"), contentType: "image/png" });
    expect(up.storageId).toBeTruthy();

    const counters = { valuableWeighted: 3, distinctCommenters: 2, replyCount: 1, saveCount: 1, qualifiedReads: 5, returns7d: 0, qualifiedExposureCount: 3, lastEligibleInteractionOffsetMs: -3_600_000 };
    await t.mutation(importMembers.importMembers, {
      seq: 0, worldEnd,
      rows: [
        { handle: "covered", name: "Covered Author", email: "covered@demo.createconomy.invalid", bio: "b", joinOffsetMs: -90 * 86_400_000, verified: true },
        { handle: "bare", name: "Bare Author", email: "bare@demo.createconomy.invalid", bio: "b", joinOffsetMs: -90 * 86_400_000, verified: true },
      ],
    });
    await t.mutation(importPosts.importPosts, {
      seq: 0, worldEnd,
      rows: [
        { ref: "c0", authorEmail: "covered@demo.createconomy.invalid", type: "help" as const, title: "With cover", body: "Body A", categoryId: "video", toolIds: [], createdOffsetMs: -2 * 86_400_000, counters, help: { problemStatement: "How do I add a cover?" } },
        { ref: "c1", authorEmail: "bare@demo.createconomy.invalid", type: "help" as const, title: "Without cover", body: "Body B", categoryId: "video", toolIds: [], createdOffsetMs: -2 * 86_400_000, counters, help: { problemStatement: "Why is mine blank?" } },
      ],
    });

    // link the stored blob onto post c0 only (real linkCover: gt anchor → postSeoMeta.ogImageAssetId)
    const link = await t.mutation(importChrome.linkCover, { postRef: "c0", storageId: up.storageId });
    expect(link.linked).toBe(true);

    const res = await t.query(feedMod.list, { sortMode: "top" });
    expect(res.page).toHaveLength(2);
    const withCover = res.page.find((r: any) => r.title === "With cover");
    const without = res.page.find((r: any) => r.title === "Without cover");
    expect(withCover).toBeTruthy();
    expect(without).toBeTruthy();

    // RED until implemented: resolved URL vs explicit null
    expect(withCover.coverImage).toMatch(/^https?:\/\/.+\/api\/storage\//);
    expect(without.coverImage).toBeNull();
  });
});

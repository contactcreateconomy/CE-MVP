import { describe, it, expect, afterEach } from "vitest";
import { convexTest } from "convex-test";
import schemaDefault from "../../convex/schema";
import * as importTools from "../../convex/demoWorld/importTools";
import * as importMembers from "../../convex/demoWorld/importMembers";
import * as importPosts from "../../convex/demoWorld/importPosts";
import * as removeMod from "../../convex/demoWorld/remove";
import * as generatedApi from "../../convex/_generated/api"; // module-root anchor for convex-test

/* CR-011 demo-world import surface: guard wiring, registry round-trip,
 * idempotent re-import, counters-as-exact-tallies + zero scores + dirtySince,
 * and the dedicated postNews insert. Env-mutating scenarios run sequentially
 * inside single `it` blocks (no cross-test env races). */

const modules = { importTools, importMembers, importPosts, remove: removeMod, "convex/_generated/api": generatedApi };

afterEach(() => {
  delete process.env.CONVEX_CLOUD_URL;
});

describe("demoWorld guard wiring (devGuard loopback on every entry point)", () => {
  it("refuses cloud + unset, accepts loopback (sequential scenarios)", async () => {
    const t = convexTest(schemaDefault, modules);
    const toolRow = { slug: "x", name: "X", categoryIds: ["video"], officialUrl: "https://x.test" };

    process.env.CONVEX_CLOUD_URL = "https://some-deployment.convex.cloud";
    await expect(t.mutation(importTools.importTools, { seq: 0, rows: [toolRow] })).rejects.toThrow(/dev guard: refusing/);

    delete process.env.CONVEX_CLOUD_URL;
    await expect(t.mutation(importTools.importTools, { seq: 0, rows: [toolRow] })).rejects.toThrow(/dev guard: refusing/);

    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    const out = await t.mutation(importTools.importTools, { seq: 0, rows: [toolRow] });
    expect(out.inserted).toBe(1);
  });
});

describe("demoWorld registry round-trip + idempotency + tallies (loopback)", () => {
  it("re-import skips; removeBatch drains to zero; counters are tallies, scores zero + dirty, news has its own insert", async () => {
    process.env.CONVEX_CLOUD_URL = "http://127.0.0.1:3210";
    const t = convexTest(schemaDefault, modules);
    const worldEnd = Date.now();

    // members: idempotent by email
    const member = { handle: "tester", name: "Test Person", email: "tester@demo.createconomy.invalid", bio: "bio", joinOffsetMs: -90 * 86_400_000, verified: true };
    expect((await t.mutation(importMembers.importMembers, { seq: 0, worldEnd, rows: [member] })).inserted).toBe(1);
    const m2 = await t.mutation(importMembers.importMembers, { seq: 1, worldEnd, rows: [member] });
    expect(m2.inserted).toBe(0);
    expect(m2.skipped).toBe(1);

    // tools: idempotent by slug
    const toolRow = { slug: "runway", name: "Runway", categoryIds: ["video"], officialUrl: "https://runway.com" };
    expect((await t.mutation(importTools.importTools, { seq: 0, rows: [toolRow] })).inserted).toBe(1);
    expect((await t.mutation(importTools.importTools, { seq: 1, rows: [toolRow] })).skipped).toBe(1);

    // posts: news gets the DEDICATED postNews insert; counters = exact tallies; scores zero + dirtySince claim
    await t.mutation(importMembers.importMembers, {
      seq: 2, worldEnd,
      rows: [{ handle: "newsy", name: "News Writer", email: "newsy@demo.createconomy.invalid", bio: "b", joinOffsetMs: -30 * 86_400_000, verified: true }],
    });
    const counters = { valuableWeighted: 7, distinctCommenters: 3, replyCount: 2, saveCount: 1, qualifiedReads: 40, returns7d: 4, qualifiedExposureCount: 12, lastEligibleInteractionOffsetMs: -3_600_000 };
    const newsRow = {
      ref: "p0", authorEmail: "newsy@demo.createconomy.invalid", type: "news" as const,
      title: "Sora API is gone", body: "The Videos API shut down for good.", categoryId: "video",
      toolIds: [], createdOffsetMs: -2 * 86_400_000, counters,
      news: { sourceOfTruthUrl: "https://help.openai.com", keyClaims: ["API shut down 2026-09-24"] },
    };
    expect((await t.mutation(importPosts.importPosts, { seq: 0, worldEnd, rows: [newsRow] })).inserted).toBe(1);
    expect((await t.mutation(importPosts.importPosts, { seq: 1, worldEnd, rows: [{ ...newsRow, title: "dup" }] })).skipped).toBe(1); // idempotent by ref

    const posts = await t.query(async (ctx: any) => ctx.db.query("posts").collect());
    expect(posts).toHaveLength(1);
    expect(posts[0].moderationStatus).toBe("passed");
    expect(posts[0].lifecycleStatus).toBe("published");

    const news = await t.query(async (ctx: any) => ctx.db.query("postNews").collect()); // dedicated insert (insertExtensionRow has no news case)
    expect(news).toHaveLength(1);
    expect(news[0].sourceOfTruthUrl).toBe("https://help.openai.com");

    const seo = await t.query(async (ctx: any) => ctx.db.query("postSeoMeta").collect());
    expect(seo).toHaveLength(1);

    const dist = await t.query(async (ctx: any) => ctx.db.query("postDistributionScores").collect());
    expect(dist).toHaveLength(1);
    expect(dist[0].valuableWeighted).toBe(7); // exact tally of imported events (A5.1)
    expect(dist[0].distinctCommenters).toBe(3);
    expect(dist[0].saveCount).toBe(1);
    expect(dist[0].topScore).toBe(0); // scores are NEVER hand-written
    expect(dist[0].hotScore).toBe(0);
    expect(dist[0].trendScore).toBe(0);
    expect(dist[0].dirtySince).toBe(worldEnd); // claim for the real distributionRecompute

    const gt = await t.query(async (ctx: any) => ctx.db.query("demoGroundTruth").collect());
    expect(gt).toHaveLength(1); // post anchor = idempotency key + ground truth

    // registry removal drains to zero across tables in dependency order
    let total = 0;
    for (const table of ["postDistributionScores", "postSeoMeta", "postNews", "postRevisions", "posts", "tools", "users", "demoGroundTruth"]) {
      let n;
      do {
        n = await t.mutation(removeMod.removeBatch, { table, limit: 500 });
        total += n.deleted;
      } while (n.deleted > 0);
    }
    const status = await t.mutation(removeMod.removalStatus, {});
    expect(status.registryRows).toBe(0);
    expect(total).toBeGreaterThanOrEqual(4);
  });
});

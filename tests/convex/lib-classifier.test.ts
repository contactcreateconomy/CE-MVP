import { describe, it, expect, vi, afterEach } from "vitest";
import { classifySafety } from "../../convex/lib/classifier";

/* Convex unit tests — Testing-Strategy row 4.
 * classifier.ts is the H-SAFE moderation seam (CAP-073). Its defining
 * contract: FAIL-CLOSED. Missing env = unavailable; provider error =
 * unavailable; only a 200 with unsafe===true is ever "unsafe".
 * The pipeline holds every candidate until this seam reports available.
 */

describe("classifySafety (CAP-073, H-SAFE seam)", () => {
  afterEach(() => {
    delete process.env.MODERATION_CLASSIFIER_API_KEY;
    delete process.env.MODERATION_CLASSIFIER_ENDPOINT;
    vi.unstubAllGlobals();
  });

  it("reports unavailable when env is not configured (founder key pending)", async () => {
    const res = await classifySafety("anything");
    expect(res.available).toBe(false);
    expect(res.unsafe).toBeUndefined();
  });

  it("reports unavailable when only the key is set", async () => {
    process.env.MODERATION_CLASSIFIER_API_KEY = "k-test";
    const res = await classifySafety("anything");
    expect(res.available).toBe(false);
  });

  it("reports unavailable when only the endpoint is set", async () => {
    process.env.MODERATION_CLASSIFIER_ENDPOINT = "https://mod.example";
    const res = await classifySafety("anything");
    expect(res.available).toBe(false);
  });

  it("returns unsafe=true on a clean 200 with unsafe:true", async () => {
    process.env.MODERATION_CLASSIFIER_API_KEY = "k-test";
    process.env.MODERATION_CLASSIFIER_ENDPOINT = "https://mod.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ unsafe: true }), { status: 200 }),
      ),
    );
    const res = await classifySafety("bad text");
    expect(res).toEqual({ available: true, unsafe: true, provider: "https://mod.example" });
  });

  it("provider error (500) = unavailable, never pass-through (fail-closed)", async () => {
    process.env.MODERATION_CLASSIFIER_API_KEY = "k-test";
    process.env.MODERATION_CLASSIFIER_ENDPOINT = "https://mod.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("boom", { status: 500 })),
    );
    const res = await classifySafety("any text");
    expect(res.available).toBe(false);
    expect(res.provider).toBe("https://mod.example");
    expect(res.unsafe).toBeUndefined();
  });

  it("network failure = unavailable, never pass-through (fail-closed)", async () => {
    process.env.MODERATION_CLASSIFIER_API_KEY = "k-test";
    process.env.MODERATION_CLASSIFIER_ENDPOINT = "https://mod.example";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNREFUSED")));
    const res = await classifySafety("any text");
    expect(res.available).toBe(false);
    expect(res.unsafe).toBeUndefined();
  });

  it("only unsafe === true (strict) is treated as unsafe — no truthy coercion", async () => {
    process.env.MODERATION_CLASSIFIER_API_KEY = "k-test";
    process.env.MODERATION_CLASSIFIER_ENDPOINT = "https://mod.example";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ unsafe: "yes" }), { status: 200 }),
      ),
    );
    const res = await classifySafety("text");
    expect(res).toEqual({ available: true, unsafe: false, provider: "https://mod.example" });
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { glmScore, glmGenerate } from "../../convex/lib/glm";

/* Convex unit tests — Testing-Strategy row 4.
 * glm.ts is the GLM seam (CAP-078/079 soft scores, CAP-170 persona
 * generation). Contract: fail-closed — missing env or provider error
 * THROWS (never fabricates a score); response parsing is strict.
 */

describe("glmScore / glmGenerate (fail-closed seam)", () => {
  afterEach(() => {
    delete process.env.GLM_API_KEY;
    delete process.env.GLM_API_BASE;
    delete process.env.GLM_MODEL;
    vi.unstubAllGlobals();
  });

  it("throws when GLM_API_KEY is unset (dependency error, fail-closed)", async () => {
    await expect(glmScore("S-DISC", "prompt")).rejects.toThrow(/GLM_API_KEY unset/);
    await expect(glmGenerate("k", "sys", "user")).rejects.toThrow(/GLM_API_KEY unset/);
  });

  it("scores a clean strict-JSON 200 response", async () => {
    process.env.GLM_API_KEY = "k-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: '{"score": 4, "evidence": "solid"}' } }] }),
          { status: 200 },
        ),
      ),
    );
    const res = await glmScore("S-DISC", "prompt");
    expect(res).toEqual({ score: 4, evidence: "solid" });
  });

  it("rounds non-integer scores to integers", async () => {
    process.env.GLM_API_KEY = "k-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: '{"score": 3.6, "evidence": "e"}' } }] }),
          { status: 200 },
        ),
      ),
    );
    const res = await glmScore("S-DISC", "prompt");
    expect(res.score).toBe(4);
  });

  it("rejects out-of-range scores (fail-closed, not clamped)", async () => {
    process.env.GLM_API_KEY = "k-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: '{"score": 9, "evidence": "e"}' } }] }),
          { status: 200 },
        ),
      ),
    );
    await expect(glmScore("S-DISC", "p")).rejects.toThrow(/unparseable|out of range/);
  });

  it("provider error (500) throws — never fabricates a score", async () => {
    process.env.GLM_API_KEY = "k-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("boom", { status: 500 })),
    );
    await expect(glmScore("S-VAL", "p")).rejects.toThrow(/provider error 500/);
  });

  it("unparseable model output throws with a truncated excerpt", async () => {
    process.env.GLM_API_KEY = "k-test";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ choices: [{ message: { content: 'not json at all' } }] }),
          { status: 200 },
        ),
      ),
    );
    await expect(glmScore("S-DISC", "p")).rejects.toThrow(/unparseable/);
  });

  it("glmGenerate returns trimmed content and throws on empty generation", async () => {
    process.env.GLM_API_KEY = "k-test";
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ choices: [{ message: { content: "  generated text  " } }] }),
        { status: 200 },
      ),
    );
    await expect(glmGenerate("persona", "sys", "user")).resolves.toBe("generated text");

    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ choices: [{ message: { content: "   " } }] }), { status: 200 }),
    );
    await expect(glmGenerate("persona", "sys", "user")).rejects.toThrow(/empty generation/);
  });

  it("sends the key as a bearer header and honors GLM_API_BASE/GLM_MODEL", async () => {
    process.env.GLM_API_KEY = "k-test";
    process.env.GLM_API_BASE = "https://glmvirt.example/v4";
    process.env.GLM_MODEL = "glm-5";
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ choices: [{ message: { content: '{"score": 2, "evidence": "e"}' } }] }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    await glmScore("S-DISC", "p");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://glmvirt.example/v4/chat/completions");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer k-test");
    expect(JSON.parse(String(init.body)).model).toBe("glm-5");
  });
});

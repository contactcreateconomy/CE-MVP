import { describe, it, expect } from "vitest";
import { hashContent } from "../../convex/lib/hash";

/* Convex unit tests — Testing-Strategy row 4.
 * hash.ts = FNV-1a 32-bit x4 lanes → 32-hex digest (CAP-062 contentHash
 * dedup key). Not security — dedup only. Locking the contract so the
 * digest format and collision properties can't drift silently.
 */

describe("hashContent (CAP-062)", () => {
  it("returns a 32-char lowercase hex digest", () => {
    const h = hashContent("hello world");
    expect(h).toMatch(/^[0-9a-f]{32}$/);
  });

  it("is deterministic", () => {
    expect(hashContent("hello world")).toBe(hashContent("hello world"));
  });

  it("differentiates inputs (no trivial collisions)", () => {
    const a = hashContent("post body A");
    const b = hashContent("post body B");
    expect(a).not.toBe(b);
  });

  it("empty string still yields a stable full-length digest", () => {
    const h = hashContent("");
    expect(h).toMatch(/^[0-9a-f]{32}$/);
    expect(h).toBe(hashContent(""));
  });

  it("distinguishes near-identical long bodies (edit detection use case)", () => {
    const base = "x".repeat(1000);
    expect(hashContent(base)).not.toBe(hashContent(base + " "));
    expect(hashContent(base)).not.toBe(hashContent(base.slice(0, 999)));
  });

  it("the four 8-hex lanes differ across inputs (lane independence smoke)", () => {
    const lanes = (h: string) => [h.slice(0, 8), h.slice(8, 16), h.slice(16, 24), h.slice(24, 32)];
    const l1 = lanes(hashContent("alpha"));
    const l2 = lanes(hashContent("beta"));
    // At least 3 of 4 lanes should move between two distinct short inputs.
    const moved = l1.filter((lane, i) => lane !== l2[i]).length;
    expect(moved).toBeGreaterThanOrEqual(3);
  });
});

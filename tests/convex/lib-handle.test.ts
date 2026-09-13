import { describe, it, expect } from "vitest";
import { normalizeHandle } from "../../convex/lib/handle";

/* Convex unit tests — Testing-Strategy row 4.
 * handle.ts is the CAP-474-discipline normalizer (NFKD, combining-mark
 * strip, latin-supplement map, 32-char cap, ≥3 else member- fallback).
 */

describe("normalizeHandle (CAP-474)", () => {
  it("lowercases and hyphenates ASCII input", () => {
    expect(normalizeHandle("Ada Lovelace")).toBe("ada-lovelace");
    expect(normalizeHandle("Already-Slugged")).toBe("already-slugged");
  });

  it("strips combining marks so José → jose (the documented divergence fix)", () => {
    expect(normalizeHandle("José")).toBe("jose");
    expect(normalizeHandle("ÜBER")).toBe("uber");
  });

  it("maps latin-supplement letters NFKD cannot decompose", () => {
    expect(normalizeHandle("Søren")).toBe("soren");
    expect(normalizeHandle("Straße")).toBe("strasse");
    expect(normalizeHandle("Łukasz")).toBe("lukasz");
  });

  it("collapses runs of non-alphanumerics into a single hyphen and trims edges", () => {
    expect(normalizeHandle("  multiple   spaces  ")).toBe("multiple-spaces");
    expect(normalizeHandle("--leading-and-trailing--")).toBe("leading-and-trailing");
    expect(normalizeHandle("a!@#$%b")).toBe("a-b");
  });

  it("caps at 32 chars without a trailing hyphen", () => {
    const out = normalizeHandle("a".repeat(40));
    expect(out).toHaveLength(32);
    expect(out).toMatch(/^a+$/);
  });

  it("falls back to member- for results shorter than 3 chars", () => {
    expect(normalizeHandle("ab")).toBe("member-ab");
    expect(normalizeHandle("a-b")).toBe("a-b"); // exactly 3 chars — no fallback
    expect(normalizeHandle("!!!")).toBe("member-x"); // strips to empty
  });

  it("never returns an empty or sub-3-char string", () => {
    for (const src of ["", " ", "-", "!!", "æ", "ø", "ß"]) {
      const out = normalizeHandle(src);
      expect(out.length).toBeGreaterThanOrEqual(3);
    }
  });
});

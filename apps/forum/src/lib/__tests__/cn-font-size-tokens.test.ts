/**
 * FEED-B1 #1 — cn() must know our named font-size tokens.
 *
 * Stock tailwind-merge treats unknown `text-*` values as text COLOURS, so
 * `cn("text-caption", "text-text-primary")` dropped the size (the colour
 * "won" the conflict). Sizes and colours must coexist; two sizes must
 * still conflict (last wins).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { cn, FONT_SIZE_TOKENS } from "../utils";

const tokensCss = readFileSync(resolve(__dirname, "../../../../../packages/design-tokens/tokens.css"), "utf8");
const cssSizeTokens = Array.from(tokensCss.matchAll(/^\s*--text-([a-z0-9-]+):/gm))
  .map((m) => m[1])
  .filter((n) => !n.includes("--"))
  .filter((n) => !["primary", "secondary", "muted", "disabled", "inverse", "link", "link-hover", "on-media"].includes(n));

describe("cn() font-size tokens (FEED-B1)", () => {
  it("keeps a named size next to a text colour", () => {
    expect(cn("text-caption", "text-text-primary")).toBe("text-caption text-text-primary");
    expect(cn("text-heading-lg text-(--text-muted)")).toBe("text-heading-lg text-(--text-muted)");
  });

  it("still resolves two named sizes to the last one", () => {
    expect(cn("text-caption", "text-body-md")).toBe("text-body-md");
    expect(cn("text-body-md", "text-sm")).toBe("text-sm");
  });

  it("covers every --text-<size> token in tokens.css", () => {
    expect([...new Set(cssSizeTokens)].sort()).toEqual([...FONT_SIZE_TOKENS].sort());
    for (const name of FONT_SIZE_TOKENS) {
      expect(cn(`text-${name}`, "text-text-secondary")).toBe(`text-${name} text-text-secondary`);
    }
  });
});

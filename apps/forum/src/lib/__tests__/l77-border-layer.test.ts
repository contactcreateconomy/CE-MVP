/**
 * L-77 — the global `* { border-color: transparent }` reset must live in
 * `@layer base`. Unlayered, it beat every utility-layer border colour, so no
 * themed border (border-border-default / -active / …) ever rendered.
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(resolve(__dirname, "../../../../.."), "packages/design-tokens/tokens.css"), "utf8");

describe("L-77 border reset is layered", () => {
  it("the * border reset sits inside @layer base", () => {
    expect(css).toMatch(/@layer base\s*\{\s*\*\s*\{\s*@apply border-transparent;\s*\}\s*\}/);
  });
  it("no unlayered top-level * rule remains", () => {
    expect(css).not.toMatch(/(^|\n)\*\s*\{/);
  });
});

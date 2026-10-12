/**
 * FEED-B1 fix-3 — L-73 (frost carries its layer shadow + high-contrast
 * fallback), L-74 (--duration-press 100ms), L-75 (Iris ≤ 400ms),
 * L-76 (no sustained pulses; dark focus = solid 2px ring).
 */
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = resolve(__dirname, "../../../../..");
const utilities = readFileSync(join(REPO, "packages/design-tokens/utilities.css"), "utf8");
const tokens = readFileSync(join(REPO, "packages/design-tokens/tokens.css"), "utf8");

function block(css: string, opener: string): string {
  const start = css.indexOf(opener);
  if (start < 0) return "";
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}" && --depth === 0) return css.slice(start, i + 1);
  }
  return "";
}
const topLevel = (b: string) => b.replace(/@(media|supports)[^{]*\{[\s\S]*?\n {2}\}/g, "");
const tokenValue = (scope: string, name: string) =>
  block(tokens, scope).match(new RegExp(`\\n\\s*${name}:\\s*([^;]+);`))?.[1]?.trim();

describe("L-73 frost carries its layer shadow (Bible §3.1)", () => {
  const cases: [string, RegExp][] = [
    ["frost-look", /box-shadow:\s*inset 0 1px 0 var\(--frost-highlight\),\s*var\(--shadow-xs\)/],
    ["frost-subtle", /box-shadow:\s*var\(--shadow-md\)/],
    ["frost-strong", /box-shadow:\s*var\(--shadow-md\)/],
  ];
  for (const [name, shadow] of cases) {
    it(`.${name}: layer shadow at rest`, () => {
      expect(topLevel(block(utilities, `@utility ${name} {`))).toMatch(shadow);
    });
    it(`.${name}: prefers-contrast: more → solid + 1px border/prominent`, () => {
      const hc = block(block(utilities, `@utility ${name} {`), "@media (prefers-contrast: more)");
      expect(hc, "missing @media (prefers-contrast: more)").not.toBe("");
      expect(hc).toMatch(/background:\s*var\(--bg-surface\)/);
      expect(hc).toMatch(/border:\s*1px solid var\(--border-prominent\)/);
      if (name !== "frost-look") expect(hc).toMatch(/backdrop-filter:\s*none/);
    });
  }
});

describe("L-74 press duration token", () => {
  it("--duration-press: 100ms + duration-press utility + STYLE-KIT entry", () => {
    expect(tokenValue(":root {", "--duration-press")).toBe("100ms");
    expect(utilities).toMatch(/@utility duration-press \{\s*transition-duration: var\(--duration-press\);/);
    const kit = readFileSync(join(REPO, "docs/04-design-system/STYLE-KIT.md"), "utf8");
    expect(kit).toMatch(/duration\/press\s+100ms/);
  });
});

describe("L-75 Iris ≤ 400ms", () => {
  it("the Iris animation resolves to a duration token ≤ 400ms", () => {
    const rule = block(utilities, 'html[data-theme-switch="iris"]::view-transition-new(root) {');
    const name = rule.match(/animation:\s*theme-switch-iris\s+var\((--duration-[\w-]+)\)/)?.[1];
    expect(name, "Iris must use a duration token").toBeDefined();
    const ms = Number(tokenValue(":root {", name!)?.replace("ms", ""));
    expect(ms).toBeGreaterThan(0);
    expect(ms).toBeLessThanOrEqual(400);
    const src = readFileSync(join(REPO, "apps/forum/src/lib/theme-transition.ts"), "utf8");
    expect(src).toMatch(/L-75/);
  });
});

describe("L-76 no sustained pulses; solid focus ring", () => {
  it("pulse-live and animate-pulse-glow are gone from shared CSS", () => {
    expect(utilities).not.toMatch(/pulse-live|animate-pulse-glow|@keyframes pulse-glow|glow-live-pulse/);
  });
  it("dark focus = solid 2px ring, no glow halo (same as light)", () => {
    const dark = tokenValue(".dark {", "--glow-focus");
    expect(dark).toMatch(/^0 0 0 2px hsl\([^)]*\)$/);
    expect(dark).toBe(tokenValue(":root {", "--glow-focus"));
  });
});

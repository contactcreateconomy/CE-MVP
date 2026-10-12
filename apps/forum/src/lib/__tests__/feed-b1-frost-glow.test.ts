/**
 * FEED-B1 #2 — frost utilities (L-39, L-40) + no glow at rest (L-38).
 *
 * Frost: .frost-strong / .frost-subtle = real backdrop blur with solid
 * fallbacks (no support / reduced transparency), NEUTRAL (no saturate
 * boost → no colour bleed). .frost-look = feed-card surface with NO live
 * blur: translucent surface + 1px top highlight.
 *
 * Glow at rest: a glow class without a state variant (hover/active/focus…)
 * is allowed only for selected/active/open states, listed below with why.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
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

describe("frost utilities (L-39, L-40)", () => {
  for (const name of ["frost-strong", "frost-subtle"]) {
    it(`.${name}: real blur + solid fallbacks`, () => {
      const b = block(utilities, `@utility ${name} {`);
      expect(b, `@utility ${name} missing`).not.toBe("");
      expect(b).toMatch(/-webkit-backdrop-filter:\s*var\(--frost-/);
      expect(b).toMatch(/\n\s*backdrop-filter:\s*var\(--frost-/);
      expect(b).toMatch(/@supports not[\s\S]*background:\s*var\(--bg-surface\)/);
      expect(b).toMatch(/prefers-reduced-transparency: reduce[\s\S]*background:\s*var\(--bg-surface\)/);
    });
  }

  it(".frost-look: no live blur, translucent surface + 1px top highlight", () => {
    const b = block(utilities, "@utility frost-look {");
    expect(b, "@utility frost-look missing").not.toBe("");
    expect(b).not.toMatch(/backdrop-filter:\s*(?!none)/);
    expect(b).toMatch(/background:\s*var\(--frost-look-bg\)/);
    expect(b).toMatch(/inset 0 1px 0 var\(--frost-highlight\)/);
  });

  it("frost tokens exist in both themes and stay neutral (no saturate)", () => {
    const light = block(tokens, ":root {");
    const dark = block(tokens, ".dark {");
    for (const t of ["--frost-subtle-bg", "--frost-strong-bg", "--frost-look-bg", "--frost-highlight"]) {
      expect(light, `${t} (light)`).toContain(`${t}:`);
      expect(dark, `${t} (dark)`).toContain(`${t}:`);
    }
    for (const t of ["--frost-subtle-blur", "--frost-strong-blur"]) expect(light).toContain(`${t}:`);
    const frostDecls = (light + dark).split("\n").filter((l) => /--frost-/.test(l) && l.includes(":"));
    expect(frostDecls.filter((l) => /saturate\(/.test(l))).toEqual([]);
  });
});

/* ── Glow at rest (L-38 / R-08) ─────────────────────────────────────── */
const GLOW = /(?<![\w:.-])((?:[\w/\[\]=-]+:)*)(shadow-glow-primary-[\w-]+|glow-cta|electric-glow|animate-pulse-glow|pulse-live)(?![\w-])/g;
const STATE_VARIANT = /(^|:)(hover|active|focus|focus-visible|focus-within|(?:group|peer)-(?:hover|focus|focus-visible|focus-within)(?:\/[\w-]+)?|aria-[\w-]+|data-\[[^\]]+\])(?=:)/;

/** file → allowed at-rest glow count; each is a selected / active / open state (L-38 allows glow/active). */
const ALLOWED_STATE_GLOW: Record<string, number> = {
  "apps/forum/src/components/discussion/thread-header.tsx": 2, // upvoted / bookmarked (selected)
  "apps/forum/src/components/ui/tiered-ladder.tsx": 1, // current tier
  "apps/forum/src/components/ui/interactive-hover-button.tsx": 1, // active prop
  "apps/forum/src/components/ui/datetime-picker/index.tsx": 1, // popover open
  "apps/forum/src/components/ui/combobox.tsx": 1, // popover open
  "apps/forum/src/components/new-post/new-post-composer.tsx": 1, // active type indicator
  "apps/forum/src/components/layout/left-sidebar.tsx": 1, // active category indicator
  "apps/forum/src/components/layout/podium-widget.tsx": 1, // active window pill
};

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (e === "__tests__" || e === "node_modules" || p.includes("/app/(app)/lab")) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(e)) out.push(p);
  }
  return out;
}

describe("no glow at rest (L-38)", () => {
  it("every unconditioned glow class is an allowed active/open state", () => {
    const found: Record<string, number> = {};
    for (const f of [...walk(join(REPO, "apps/forum/src")), ...walk(join(REPO, "packages/auth-ui/src"))]) {
      const src = readFileSync(f, "utf8");
      for (const m of src.matchAll(GLOW)) {
        if (STATE_VARIANT.test(m[1] ?? "")) continue;
        const rel = relative(REPO, f);
        found[rel] = (found[rel] ?? 0) + 1;
      }
    }
    expect(found).toEqual(ALLOWED_STATE_GLOW);
  });
});

/* ── Sorter pill (L-70) ─────────────────────────────────────────────── */
describe("sorter active pill = solid brand, no glow (L-70)", () => {
  for (const f of ["apps/forum/src/components/feed/feed-tabs.tsx", "apps/forum/src/components/feed/trend-sorter.tsx"]) {
    it(f.split("/").pop()!, () => {
      const code = readFileSync(join(REPO, f), "utf8").replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
      expect(code).not.toMatch(/glow/);
      expect(code).toMatch(/bg-brand-primary/);
    });
  }
});

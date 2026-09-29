import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

/* S00-T01 / spec §5.1 — the single-source rule: after the shared tokens moved
 * to packages/design-tokens/tokens.css, NO app globals.css may declare a
 * token. Fails on any --color-*, --bg-*, --text-*, --glow-*, --glass-*,
 * --shadow-*, --space-*, --radius-*, --duration-*, --ease-* declaration. */

const APP_GLOBALS = [
  path.resolve(__dirname, "../../../src/app/globals.css"), // apps/forum
  path.resolve(__dirname, "../../../../../apps/admin/src/app/globals.css"), // apps/admin
];

const TOKEN_DECLARATION =
  /^\s*--(color|bg|text|glow|glass|shadow|space|radius|duration|ease)-[\w-]+\s*:/m;

describe("S00-T01 token single source (spec §5.1)", () => {
  it("both apps import the shared token package", () => {
    for (const file of APP_GLOBALS) {
      const css = readFileSync(file, "utf8");
      expect(css, `${file} must @import the shared tokens`).toMatch(
        /@import\s+"\.\.\/\.\.\/\.\.\/\.\.\/packages\/design-tokens\/tokens\.css";/,
      );
    }
  });

  it("no app globals.css declares a token (all live in packages/design-tokens)", () => {
    const offenders: string[] = [];
    for (const file of APP_GLOBALS) {
      const css = readFileSync(file, "utf8");
      if (TOKEN_DECLARATION.test(css)) offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("admin globals.css stays under 100 lines", () => {
    const admin = APP_GLOBALS[1]!;
    const lines = readFileSync(admin, "utf8").split(/\r?\n/).length;
    expect(lines).toBeLessThan(100);
  });
});

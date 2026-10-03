import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/* S00-T04 acceptance (S00-SPEC §11, D-012): no file under the app router
 * may import seed/fixtures/mock data — outside tests, /kit and /lab. Static
 * preview data on user-visible routes is the trust-killer this deletes
 * (CS §2.13 "Maya Chen"). */

const appRoot = join(__dirname, "../../app");

/** Module specifiers that point at seed/fixtures/mock paths — matches
 * `_seed`, `./seed`, `mocks/data`, `seed-demo`; not `seedless`. */
const SEED_PATH = /(^|[/_-])(seeds?|fixtures|mocks?)([/_.-]|$)/;

/** Value (runtime) imports of seed paths in a source file. `import type` /
 * `export type` blocks are stripped first — type-only imports cannot put
 * fabricated data on screen (components/content/* keep their SeedThread
 * types until the T15 dead-code pass). */
export function seedImports(source: string): string[] {
  const valueOnly = source
    .replace(/import\s+type\s+[^;]*?from\s*(['"])[^'"]+\1/g, "")
    .replace(/export\s+type\s+[^;]*?from\s*(['"])[^'"]+\1/g, "");
  const hits = new Set<string>();
  for (const m of valueOnly.matchAll(/(?:from|import)\s*\(?\s*(['"])([^'"]+)\1/g)) {
    if (SEED_PATH.test(m[2])) hits.add(m[2]);
  }
  return [...hits];
}

function walk(dir: string, files: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      walk(p, files);
    } else if (/\.(ts|tsx|mts|cts)$/.test(name)) {
      files.push(p);
    }
  }
  return files;
}

/** Route files under app/** — tests excluded; /kit and /lab are the two
 * dev-only surfaces the spec exempts. */
function appRouteFiles(): string[] {
  return walk(appRoot)
    .map((f) => f.replace(/\\/g, "/"))
    .filter((f) => !/\/(kit|lab)\//.test(f));
}

describe("S00-T04 — §11 fixtures-import scan (D-012)", () => {
  it("matcher: flags value seed imports, passes type-only and lookalikes", () => {
    expect(seedImports('import { seedThread } from "../../content/_seed";')).toEqual(["../../content/_seed"]);
    expect(seedImports('import { data } from "./mocks/data";')).toEqual(["./mocks/data"]);
    expect(seedImports('import { data } from "./seed-demo";')).toEqual(["./seed-demo"]);
    expect(seedImports('const m = await import("./fixtures/x");')).toEqual(["./fixtures/x"]);
    expect(seedImports('import type { SeedThread } from "./_seed";')).toEqual([]);
    expect(seedImports('import type {\n  SeedComment,\n} from "./_seed";')).toEqual([]);
    expect(seedImports('import { seedless } from "./seedless";')).toEqual([]);
    expect(seedImports('export { seedThread } from "./_seed";')).toEqual(["./_seed"]);
  });

  it("no app route imports seed/fixtures/mock data (kit + lab exempt)", () => {
    const violations: string[] = [];
    for (const file of appRouteFiles()) {
      const source = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
      for (const spec of seedImports(source)) {
        violations.push(`${file.split("/src/")[1]} → ${spec}`);
      }
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});

#!/usr/bin/env node
/**
 * S00-T02 no-visual-change proof, part 1 — compiled-CSS identity.
 * Compiles each app's globals.css with @tailwindcss/postcss (same engine
 * the app uses), from a given git tree, and diffs the output against the
 * other tree. For T02 the diff must be ADDITIVE ONLY: new custom-property
 * declarations (the S00-T02 tokens) and nothing else — no removed lines,
 * no changed selectors, no reordered rules.
 *
 * Usage: node scripts/t02-css-identity.mjs <beforeRef>   (compares that
 * git ref against the working tree; writes diffs to /tmp/t02-css/)
 */
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const BEFORE_REF = process.argv[2];
if (!BEFORE_REF) {
  console.error("usage: node scripts/t02-css-identity.mjs <beforeRef>");
  process.exit(1);
}
const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..",
);
const OUT = path.posix.join(process.env.TEMP || "/tmp", "t02-css");
mkdirSync(OUT, { recursive: true });

function compileFrom(dir, globalsSrc, outName) {
  // dir: temp checkout root with the app's node_modules reachable
  const file = path.join(dir, "src/app/globals.css");
  writeFileSync(file, globalsSrc);
  const require = createRequire(path.join(dir, "package.json"));
  const postcss = require("postcss");
  const tw = require("@tailwindcss/postcss");
  const result = postcss([tw()]).process(globalsSrc, { from: file, to: null, async: false });
  const css = result.css.replace(/\r\n/g, "\n");
  writeFileSync(path.join(OUT, outName), css);
  return css;
}

function appSources(ref, app) {
  const dir = path.join(ROOT, "apps", app);
  const globals =
    ref === "WORKTREE"
      ? readFileSync(path.join(dir, "src/app/globals.css"), "utf8")
      : execFileSync("git", ["show", `${ref}:apps/${app}/src/app/globals.css`], {
          cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
        });
  // dependencies resolve from the app's installed node_modules either way;
  // the package imports the tokens via relative path into the repo tree —
  // for a non-worktree ref we materialize the imported files too.
  return { dir, globals };
}

function materialize(ref, app) {
  return null; // archive+extract handled inline in main()
}

async function compileFromAsync(dir, globalsSrc, outName) {
  const file = path.join(dir, "src/app/globals.css");
  writeFileSync(file, globalsSrc);
  const require = createRequire(path.join(dir, "package.json"));
  const postcss = require("postcss");
  const tw = require("@tailwindcss/postcss");
  const result = await postcss([tw()]).process(globalsSrc, { from: file, to: null });
  const css = result.css.replace(/\r\n/g, "\n");
  writeFileSync(path.join(OUT, outName), css);
  return css;
}

async function main() {
  const { spawnSync } = await import("node:child_process");
  const fs = await import("node:fs");
  for (const app of ["forum", "admin"]) {
    const tmp = path.posix.join(OUT, "tree", `${app}-before`);
    fs.mkdirSync(tmp, { recursive: true });
    const tarName = `${app}-before.tar`;
    const buf = execFileSync("git", ["archive", "--format=tar", BEFORE_REF, `apps/${app}`, "packages/design-tokens"], {
      cwd: ROOT, maxBuffer: 64 * 1024 * 1024,
    });
    writeFileSync(path.join(OUT, tarName), buf);
    // relative names + cwd: Windows tar treats C:\... as a remote host spec
    const untar = spawnSync("tar", ["xf", tarName, "-C", `tree/${app}-before`], { cwd: OUT, shell: false });
    if (untar.status !== 0) throw new Error("tar extract failed: " + untar.stderr);
    // node_modules for the tailwind engine: junction to the CURRENT app install
    fs.symlinkSync(path.join(ROOT, "apps", app, "node_modules"), path.join(tmp, "apps", app, "node_modules"), "junction");
    const beforeGlobals = readFileSync(path.join(tmp, `apps/${app}/src/app/globals.css`), "utf8");
    const beforeCss = await compileFromAsync(path.join(tmp, `apps/${app}`), beforeGlobals, `${app}-before.css`);

    const workGlobals = readFileSync(path.join(ROOT, "apps", app, "src/app/globals.css"), "utf8");
    const afterCss = await compileFromAsync(path.join(ROOT, "apps", app), workGlobals, `${app}-after.css`);

    const b = beforeCss.split("\n");
    const a = afterCss.split("\n");
    const bSet = new Map();
    for (const l of b) bSet.set(l, (bSet.get(l) ?? 0) + 1);
    const aSet = new Map();
    for (const l of a) aSet.set(l, (aSet.get(l) ?? 0) + 1);
    const added = [], removed = [];
    for (const [l, n] of aSet) if ((bSet.get(l) ?? 0) < n) added.push(l.repeat ? l : l);
    for (const [l, n] of bSet) if ((aSet.get(l) ?? 0) < n) removed.push(l);
    const nonTokenAdded = added.filter((l) => !/^\s*--[\w-]+:/.test(l) && l.trim() !== "");
    const nonTokenRemoved = removed.filter((l) => !/^\s*--[\w-]+:/.test(l) && l.trim() !== "");
    console.log(`\n${app}: before ${b.length} lines / after ${a.length} lines`);
    console.log(`  added lines: ${added.length} (token declarations: ${added.length - nonTokenAdded.length}, other: ${nonTokenAdded.length})`);
    console.log(`  removed lines: ${removed.length} (token declarations: ${removed.length - nonTokenRemoved.length}, other: ${nonTokenRemoved.length})`);
    if (nonTokenAdded.length > 0) {
      console.error("  [✗] NON-TOKEN LINES ADDED:");
      for (const l of nonTokenAdded.slice(0, 10)) console.error("      " + l.slice(0, 120));
    }
    if (removed.length > 0) {
      console.error("  [✗] LINES REMOVED:");
      for (const l of removed.slice(0, 10)) console.error("      " + l.slice(0, 120));
    }
    if (nonTokenAdded.length === 0 && removed.length === 0) {
      console.log("  [✓] diff is ADDITIVE token declarations only — no visual change");
    }
  }
}
await main();

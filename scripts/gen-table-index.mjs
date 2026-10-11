#!/usr/bin/env node
/**
 * gen-table-index — graphify-out/tables.json: which functions touch which
 * Convex tables (L-56). For every table in convex/schema.ts, lists the
 * functions (file · export) that insert/patch/replace/delete it and that
 * query it, tagging demo/seed paths separately from production paths.
 *
 *   node scripts/gen-table-index.mjs [--out <file>] [--scan-root <dir>] [--quiet]
 *
 * No deps; pure AST-free scan with function-block attribution:
 *   - blocks = `export const NAME = mutation|query|internalMutation|…` and
 *     `export [async] function NAME` — ops inside a block belong to it;
 *   - insert: `.insert("T")`;  query: `.query("T")` (reader);
 *   - patch/replace/delete: heuristic — a block that queries T and contains
 *     `.patch(`/`.replace(`/`.delete(` is credited with that op on T (the
 *     common `const row = query(T); patch(row._id)` shape). Approximate by
 *     design: this is a discovery index, not a type checker.
 *   - class: "demo_seed" for convex/{demoWorld,seed,dev}/** (seeding/demo
 *     surface), "prod" for everything else.
 * Wired to run after every graphify regen (appended to the git post-commit /
 * post-checkout hooks, outside the graphify-managed block):
 *   node scripts/gen-table-index.mjs --quiet || true
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
const argOf = (flag, dflt) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const QUIET = argv.includes("--quiet");
const ROOT = path.resolve(import.meta.dirname, "..");
const OUT = path.resolve(ROOT, argOf("--out", path.join("graphify-out", "tables.json")));
const SCAN_ROOT = path.resolve(ROOT, argOf("--scan-root", "convex"));

const say = (...a) => { if (!QUIET) console.log(...a); };

// ── tables from the schema ──────────────────────────────────────────────
const schemaFile = path.join(SCAN_ROOT, "schema.ts");
if (!existsSync(schemaFile)) {
  console.error(`gen-table-index: ${schemaFile} not found`);
  process.exit(1);
}
const schemaSrc = readFileSync(schemaFile, "utf8");
const tables = [...schemaSrc.matchAll(/^  ([a-zA-Z_][a-zA-Z0-9_]*): defineTable\(/gm)]
  .map((m) => m[1]);
if (tables.length === 0) {
  console.error("gen-table-index: no defineTable entries found — schema shape changed?");
  process.exit(1);
}

// ── function blocks across the scan root ────────────────────────────────
function walk(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) { if (e !== "_generated" && e !== "node_modules") out.push(...walk(p)); }
    else if (p.endsWith(".ts")) out.push(p);
  }
  return out;
}
const files = walk(SCAN_ROOT);
const BLOCK_START = /^export (?:const (\w+) = (?:internalMutation|internalQuery|internalAction|mutation|query|action|httpAction|cronJob|internalAction)|(?:async )?function (\w+))/m;

const index = Object.fromEntries(tables.map((t) => [t, { writers: [], readers: [] }]));
const rel = (p) => path.relative(ROOT, p).replace(/\\/g, "/");

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const cls = /(^|\/)(demoWorld|seed|dev)\//.test(rel(file).replace(/^convex\//, "")) ? "demo_seed" : "prod";
  const marks = [...src.matchAll(/export (?:const (\w+) =|(?:(async) )?function (\w+))/g)];
  if (marks.length === 0) continue;
  for (let i = 0; i < marks.length; i++) {
    const name = marks[i][1] ?? marks[i][3];
    const start = marks[i].index;
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    const body = src.slice(start, end);
    const line = src.slice(0, start).split("\n").length;
    const quers = new Set([...body.matchAll(/\.query\(\s*["']([a-zA-Z_]+)["']/g)].map((m) => m[1]));
    const insers = new Set([...body.matchAll(/\.insert\(\s*["']([a-zA-Z_]+)["']/g)].map((m) => m[1]));
    const patches = /\.patch\(/.test(body) ? "patch" : null;
    const replaces = /\.replace\(/.test(body) ? "replace" : null;
    const deletes = /\.delete\(/.test(body) ? "delete" : null;
    const mutOps = [patches, replaces, deletes].filter(Boolean);

    const addWriter = (t, op) => {
      if (!index[t]) return;
      let w = index[t].writers.find((x) => x.fn === name && x.file === rel(file));
      if (!w) { w = { fn: name, file: rel(file), line, ops: [], class: cls }; index[t].writers.push(w); }
      if (!w.ops.includes(op)) w.ops.push(op);
    };
    for (const t of insers) addWriter(t, "insert");
    for (const t of quers) {
      if (!index[t]) continue; // component tables (_storage, rateLimits…) aren't in schema.ts
      if (mutOps.length) for (const op of mutOps) addWriter(t, op); // heuristic: read-then-mutate
      if (!index[t].readers.some((r) => r.fn === name && r.file === rel(file))) {
        index[t].readers.push({ fn: name, file: rel(file), line, class: cls });
      }
    }
    // insert-only blocks are writers AND the insert implies presence, not a read
  }
}

// stable ordering
const sorted = Object.fromEntries(
  Object.entries(index)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([t, v]) => [t, {
      writers: v.writers.sort((a, b) => a.file.localeCompare(b.file) || a.fn.localeCompare(b.fn)),
      readers: v.readers.sort((a, b) => a.file.localeCompare(b.file) || a.fn.localeCompare(b.fn)),
    }]),
);
const payload = {
  generatedAt: new Date().toISOString(),
  scanRoot: path.relative(ROOT, SCAN_ROOT).replace(/\\/g, "/"),
  tableCount: tables.length,
  note: "patch/replace/delete attribution is heuristic (block queries T + contains the op). class: demo_seed = convex/{demoWorld,seed,dev}/**.",
  tables: sorted,
};
mkdirSync(path.dirname(OUT), { recursive: true });
// skip the write when only generatedAt would change — the hook runs on every
// commit and must not leave a perpetually dirty tree
const body = (p) => { const { generatedAt: _drop, ...rest } = p; return JSON.stringify(rest); };
if (!existsSync(OUT) || body(JSON.parse(readFileSync(OUT, "utf8"))) !== body(payload)) {
  writeFileSync(OUT, JSON.stringify(payload, null, 1) + "\n");
} else {
  say("gen-table-index: unchanged — keeping existing file (and its original generatedAt)");
}
const prodOnlyWrites = Object.entries(sorted).filter(([, v]) => v.writers.length > 0 && v.writers.every((w) => w.class === "demo_seed"));
say(`gen-table-index: ${tables.length} tables → ${path.relative(ROOT, OUT)} (${files.length} files scanned)`);
say(`  tables whose ONLY writers are demo/seed (${prodOnlyWrites.length}): ${prodOnlyWrites.map(([t]) => t).join(", ")}`);

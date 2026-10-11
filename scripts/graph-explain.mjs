#!/usr/bin/env node
/**
 * graph-explain — explain one node of the code knowledge graph.
 *
 *   node scripts/graph-explain.mjs <name> [more names…]
 *
 * Reads graphify-out/graph.json (AST graph — no API cost, no deps) and for
 * each name prints the node, its file, and its callers / callees (call-like
 * relations: calls, indirect_call, references). Name matching is
 * normalize-and-substring over node ids, labels and source files, so
 * `feed.list`, `list` (ambiguous), `distributionRecompute` and
 * `convex_jobs_rank_distributionrecompute` all work. Serves the L-56 rule:
 * every Opus session queries the graph instead of grepping blind.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

const GRAPH = path.resolve(import.meta.dirname, "..", "graphify-out", "graph.json");
if (!existsSync(GRAPH)) {
  console.error(`graph-explain: ${path.relative(process.cwd(), GRAPH)} not found — run \`graphify update .\` first.`);
  process.exit(1);
}
const g = JSON.parse(readFileSync(GRAPH, "utf8"));
const nodes = g.nodes ?? [];
const links = g.links ?? [];

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const CALL_LIKE = new Set(["calls", "indirect_call", "references"]);

const nodeById = new Map(nodes.map((n) => [n.id, n]));
// searchable strings per node: id, label, normalized label, source file path
const searchable = nodes.map((n) => ({
  n,
  keys: [norm(n.id), norm(n.label), norm(n.source_file)],
}));

function findNode(name) {
  const q = norm(name);
  // 1) exact normalized id/label
  let hit = searchable.find((e) => e.keys[0] === q || e.keys[1] === q);
  if (hit) return { node: hit.n, exact: true };
  // 2) unique suffix match on the id ("feed.list" → convex_feed_list, not
  //    FeedListState): the id ends with the query after normalization
  const suffix = searchable.filter((e) => e.keys[0].endsWith(q) || e.keys[1].endsWith(q));
  if (suffix.length === 1) return { node: suffix[0].n, exact: false };
  if (suffix.length > 1) {
    return { ambiguous: suffix.slice(0, 10).map((e) => `${e.n.id} (${e.n.source_file})`) };
  }
  // 3) unique substring match on id/label/source file
  const subs = searchable.filter((e) => e.keys[0].includes(q) || e.keys[1].includes(q) || e.keys[2].includes(q));
  if (subs.length === 1) return { node: subs[0].n, exact: false };
  if (subs.length > 1) {
    // prefer callable code nodes over file/module nodes
    const callable = subs.filter((e) => e.n._callable || e.n._callable_class);
    const pool = callable.length ? callable : subs;
    if (pool.length === 1) return { node: pool[0].n, exact: false };
    return { ambiguous: pool.slice(0, 10).map((e) => `${e.n.id} (${e.n.source_file})`) };
  }
  return null;
}

function describe(n) {
  const where = [n.source_file, n.source_location].filter(Boolean).join(" ");
  return `${n.id}\n  label : ${n.label}${n._callable ? "  (callable)" : ""}\n  file  : ${where || "?"}\n  kind  : ${n.file_type ?? "?"}${n.community_name ? `  community: ${n.community_name}` : ""}`;
}

const edge = (l, other) =>
  `  ${l.relation}${l.context ? ` [${l.context}]` : ""} → ${other.label ?? other.id}  (${other.source_file ?? "?"}${other.source_location ? " " + other.source_location : ""})`;

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("usage: node scripts/graph-explain.mjs <name> [more names…]");
  process.exit(1);
}
let misses = 0;
for (const name of names) {
  console.log(`\n═══ ${name} ═══`);
  const found = findNode(name);
  if (!found) { console.log("  no matching node"); misses += 1; continue; }
  if (found.ambiguous) {
    console.log("  ambiguous — candidates:");
    for (const c of found.ambiguous) console.log(`    ${c}`);
    misses += 1;
    continue;
  }
  const { node, exact } = found;
  console.log(describe(node));
  if (!exact) console.log("  (matched by substring — pass the full id above for exactness)");

  const callers = links.filter((l) => l.target === node.id && CALL_LIKE.has(l.relation));
  const callees = links.filter((l) => l.source === node.id && CALL_LIKE.has(l.relation));
  console.log(`  callers (${callers.length}):`);
  for (const l of callers.slice(0, 40)) {
    const other = nodeById.get(l.source);
    if (other) console.log(edge(l, other).replace("→", "←"));
  }
  if (callers.length > 40) console.log(`    … +${callers.length - 40} more`);
  if (callers.length === 0) console.log("    (none in graph)");
  console.log(`  callees (${callees.length}):`);
  for (const l of callees.slice(0, 40)) console.log(edge(l, nodeById.get(l.target) ?? { id: l.target }));
  if (callees.length > 40) console.log(`    … +${callees.length - 40} more`);
  if (callees.length === 0) console.log("    (none in graph)");
}
if (misses) process.exitCode = 2;

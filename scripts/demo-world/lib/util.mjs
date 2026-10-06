// Shared utilities for demo-world generators: seeded RNG, env, fs helpers.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

export const ROOT = path.resolve(import.meta.dirname, "../../..");
export const CACHE = path.join(ROOT, ".demo-world-cache");

export function loadEnv(file = ".env.local") {
  const env = {};
  const raw = readFileSync(path.join(ROOT, file), "utf8").replace(/^\uFEFF/, "");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*?)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
  return env;
}

/** Mulberry32 seeded RNG — deterministic worlds. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export function shuffle(r, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
export const sha = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

export function readJson(p) { return JSON.parse(readFileSync(p[0] === "/" || p[1] === ":" ? p : path.join(ROOT, p), "utf8")); }
export function writeCache(rel, data) {
  const p = path.join(CACHE, rel);
  mkdirSync(path.dirname(p), { recursive: true });
  writeFileSync(p, typeof data === "string" ? data : JSON.stringify(data, null, 1));
  return p;
}
export const cachePath = (rel) => path.join(CACHE, rel);
export const cacheExists = (rel) => existsSync(path.join(CACHE, rel));

// ── world clock: everything is offsets from world end ─────────────────
export const HOUR = 3_600_000;
export const DAY = 86_400_000;
/** worldEnd for generation reference (re-anchored at import). */
export const WORLD_END = Date.parse(readJson(".demo-world-cache/p1/world.json").worldEndReference + "T23:59:59Z");
export const offsetToAbs = (offsetMs) => WORLD_END + offsetMs;

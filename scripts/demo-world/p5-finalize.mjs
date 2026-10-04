#!/usr/bin/env node
/** p5-finalize.mjs — recover a sourced-but-files-missing P5 run:
 * re-download the LEDGER's already-chosen cover URLs (no new search-API calls),
 * crop via sharp (or store originals uncropped), regenerate deterministic SVG
 * avatars into p5/avatars/ (p5-images crashed before mkdir). Temp→rename only. */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from "node:fs";
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { readJson, writeCache, cachePath } from "./lib/util.mjs";

let sharp = null;
try { sharp = (await import("sharp")).default; } catch {}
if (!sharp) {
  try {
    const dir = readdirSync("node_modules/.pnpm").find((d) => d.startsWith("sharp@"));
    if (dir) sharp = (await import(pathToFileURL(`node_modules/.pnpm/${dir}/node_modules/sharp/dist/index.mjs`).href)).default;
  } catch (e) { console.log("sharp unavailable:", String(e.message).slice(0, 120)); }
}
console.log("sharp:", sharp ? "loaded" : "MISSING — originals stored uncropped");

mkdirSync(cachePath("p5/images"), { recursive: true });
mkdirSync(cachePath("p5/avatars"), { recursive: true });

const ledger = readJson(".demo-world-cache/p5/image-ledger.json");
const entries = ledger.images ?? [];
const EXT = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" };
const extOf = (u) => (String(u).split("?")[0].split(".").pop() || "jpg").toLowerCase();

let ok = 0, fail = 0;
const queue = entries.filter((e) => e.url && !e.coverless);
for (let i = 0; i < queue.length; i += 6) {
  await Promise.all(queue.slice(i, i + 6).map(async (e) => {
    try {
      const buf = Buffer.from(await (await fetch(e.url)).arrayBuffer());
      e.originalBytes = buf.length;
      if (sharp) {
        const base = sharp(buf).resize(1200, null, { withoutEnlargement: true });
        const c169 = await sharp(await base.toBuffer()).resize(1200, 675, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
        const c43 = await sharp(await base.toBuffer()).resize(1200, 900, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
        writeFileSync(cachePath(`p5/images/post-${e.postI}-169.webp`), c169);
        writeFileSync(cachePath(`p5/images/post-${e.postI}-43.webp`), c43);
        e.file169 = `p5/images/post-${e.postI}-169.webp`;
        e.file43 = `p5/images/post-${e.postI}-43.webp`;
        e.cropBytes = c169.length + c43.length;
        e.uploadContentType = "image/webp";
      } else {
        const ext = extOf(e.url);
        writeFileSync(cachePath(`p5/images/post-${e.postI}-orig.${ext}`), buf);
        e.file169 = `p5/images/post-${e.postI}-orig.${ext}`;
        e.uploadContentType = EXT[ext] ?? "image/jpeg";
      }
      delete e.fetchError;
      ok++;
    } catch (err) { e.fetchError = String(err.message).slice(0, 80); fail++; }
  }));
}
const lt = cachePath("p5/image-ledger.json.tmp");
writeFileSync(lt, JSON.stringify({ usedIds: ledger.usedIds, images: entries }, null, 1));
renameSync(lt, cachePath("p5/image-ledger.json"));

// avatars — deterministic, identical rules to p5-images.mjs §4
const members = readFileSync(cachePath("p2/members.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const activeHandles = new Set(readFileSync(cachePath("p3/post-plan.jsonl"), "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l).author; } catch { return ""; } }).filter((h) => h && h !== "devtest"));
const PALETTES = [["#0f766e", "#ccfbf1"], ["#7c3aed", "#ede9fe"], ["#b45309", "#fef3c7"], ["#be185d", "#fce7f3"], ["#1d4ed8", "#dbeafe"], ["#4d7c0f", "#ecfccb"], ["#b91c1c", "#fee2e2"], ["#0e7490", "#cffafe"]];
const avatars = [];
let svg = 0;
for (const m of members) {
  if (!m.hasAvatar) { avatars.push({ handle: m.handle, kind: "default" }); continue; }
  const active = activeHandles.has(m.handle);
  if (!active) { avatars.push({ handle: m.handle, kind: "default-pilot" }); continue; }
  const h = m.handle;
  const seed = [...h].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [fg, bg] = PALETTES[seed % PALETTES.length];
  const initials = (m.name || h).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="48" fill="${bg}"/><circle cx="128" cy="104" r="44" fill="${fg}" opacity="0.85"/><text x="128" y="200" font-family="system-ui,sans-serif" font-size="56" font-weight="700" fill="${fg}" text-anchor="middle">${initials}</text></svg>`;
  const f = `p5/avatars/${h}.svg`;
  writeFileSync(cachePath(f), s);
  avatars.push({ handle: h, kind: "illustrated-svg", brief: m.avatarBrief, file: f, uploadContentType: "image/svg+xml" });
  svg++;
}
writeCache("p5/avatars.json", avatars);

const withFiles = entries.filter((e) => e.file169 && !e.fetchError);
writeCache("p5/images-summary.json", {
  coverPosts: entries.length, coversWithFiles: withFiles.length, fetchFailed: fail,
  cropped: entries.filter((e) => String(e.file169).endsWith(".webp")).length,
  sources: withFiles.reduce((a, m) => { const k = (m.id ?? "none").split(":")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {}),
  uniqueIds: new Set(entries.map((m) => m.id)).size,
  avatarsSvg: svg, avatarsDefault: avatars.filter((a) => a.kind.startsWith("default")).length,
});
console.log("finalize:", JSON.stringify(readJson(".demo-world-cache/p5/images-summary.json")));
export {};

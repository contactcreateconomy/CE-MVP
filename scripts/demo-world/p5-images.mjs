#!/usr/bin/env node
/** P5 (pilot) — Image Curator: covers for ~90 posts (unique, relevant) + avatars for active members. */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { rng, pick, shuffle, readJson, writeCache, cachePath, loadEnv } from "./lib/util.mjs";
import { chatJsonArray, pool, logStats } from "./lib/llm.mjs";

const posts = readFileSync(".demo-world-cache/p3/posts.jsonl", "utf8").trim().split("\n").map((p) => JSON.parse(p));
const members = readFileSync(".demo-world-cache/p2/members.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const gtMembers = readJson(".demo-world-cache/p2/ground-truth-members.json");
const R = rng(50005);
const env = loadEnv();

// ── 1. visual briefs (LLM, batched) ─────────────────────────────────
const coverPosts = posts.map((p, i) => ({ ...p, i })).filter((p) => p.cover);
const briefs = new Map();
const briefTasks = [];
for (let b = 0; b < coverPosts.length; b += 25) {
  const slice = coverPosts.slice(b, b + 25);
  briefTasks.push(async () => {
    const arr = await chatJsonArray([
      { role: "system", content: "You are an image curator for a creator forum." },
      { role: "user", content: `For each post write a photo search brief: {"i":<idx>,"keywords":"<2-5 plain search words>","brief":"<subject, mood, setting — no text, no logos, no recognisable people>"}\nPosts:\n${slice.map((p) => `${p.i}. [${p.type}] ${p.title}`).join("\n")}\nJSON array only.` },
    ], { maxTokens: 1800, temperature: 0.7 });
    arr.forEach((r) => briefs.set(r.i, r));
  });
}
await pool(briefTasks, 6, "briefs");

// ── 2. sourcing (Pixabay primary, Unsplash for showcase/news, fallback picsum/artic) ──
const ledgerPath = cachePath("p5/image-ledger.json");
const ledger = existsSync(ledgerPath) ? readJson(".demo-world-cache/p5/image-ledger.json") : { usedIds: [], images: [] };
const used = new Set(ledger.usedIds);

async function unsplashSearch(q) {
  const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=10&orientation=landscape`, { headers: { Authorization: `Client-ID ${env.Unsplash_Access_key}` } });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results ?? []).map((x) => ({ id: `unsplash:${x.id}`, url: x.urls?.regular, w: x.width, h: x.height, credit: `Photo by ${x.user?.name} on Unsplash`, license: "Unsplash License", source: x.links?.html }));
}
let pixabayCalls = 0;
async function pixabaySearch(q) {
  if (pixabayCalls > 90) return []; // stay far inside ~100/min
  pixabayCalls++;
  const r = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(env.pixabay_API_KEY)}&q=${encodeURIComponent(q)}&per_page=10&image_type=photo&orientation=horizontal&safesearch=true`);
  if (!r.ok) return [];
  const j = await r.json();
  return (j.hits ?? []).map((x) => ({ id: `pixabay:${x.id}`, url: x.largeImageURL, w: x.imageWidth, h: x.imageHeight, credit: `Image by ${x.user} on Pixabay`, license: "Pixabay Content License", source: `https://pixabay.com/photos/${x.id}/` }));
}
async function articPick() {
  const r = await fetch("https://api.artic.edu/api/v1/artworks?fields=id,title,image_id,artist_title,license_title&page=" + (1 + Math.floor(R() * 40)) + "&limit=20");
  if (!r.ok) return null;
  const j = await r.json();
  const ok = (j.data ?? []).filter((a) => a.image_id && a.title && !/portrait|study of a man|study of a woman/i.test(a.title));
  if (!ok.length) return null;
  const a = pick(R, ok);
  return { id: `artic:${a.id}`, url: `https://www.artic.edu/iiif/2/${a.image_id}/full/1200,/0/default.jpg`, w: 1200, h: 900, credit: `"${a.title}" by ${a.artist_title} (Art Institute of Chicago)`, license: a.license_title ?? "public domain (ArtIC)", source: `https://www.artic.edu/artworks/${a.id}` };
}
const picsum = (postI) => ({ id: `picsum:p${postI}`, url: `https://picsum.photos/seed/demo-p${postI}/1200/800`, w: 1200, h: 800, credit: "Lorem Picsum", license: "Picsum (Unsplash-sourced)", source: `https://picsum.photos/seed/demo-p${postI}/1200/800` });

// ── 3. process one cover ─────────────────────────────────────────────
let sharp = null; try { sharp = (await import("sharp")).default; } catch {
  // pnpm store path (sharp not hoisted to root)
  try {
    const { readdirSync } = await import("node:fs");
    const pn = "node_modules/.pnpm";
    const dir = readdirSync(pn).find((d) => d.startsWith("sharp@"));
    if (dir) sharp = (await import(`${process.cwd()}/${pn}/${dir}/node_modules/sharp/lib/index.js`)).default;
  } catch { console.log("sharp unavailable — originals stored, crops deferred"); }
}
async function processCover(p) {
  const brief = briefs.get(p.i) ?? { keywords: p.title.split(" ").slice(0, 3).join(" "), brief: p.title };
  let chosen = null;
  if (["showcase", "news"].includes(p.type)) { for (const cand of shuffle(R, await unsplashSearch(brief.keywords))) { if (!used.has(cand.id)) { chosen = cand; break; } } }
  if (!chosen) { for (const cand of shuffle(R, await pixabaySearch(brief.keywords))) { if (!used.has(cand.id)) { chosen = cand; break; } } }
  if (!chosen && R() < 0.5) chosen = await articPick();
  if (!chosen || used.has(chosen.id)) chosen = picsum(p.i);
  used.add(chosen.id);
  const meta = { postI: p.i, type: p.type, brief: brief.brief, keywords: brief.keywords, ...chosen };
  try {
    const buf = Buffer.from(await (await fetch(chosen.url)).arrayBuffer());
    meta.originalBytes = buf.length;
    if (sharp) {
      const base = sharp(buf).resize(1200, null, { withoutEnlargement: true });
      const c169 = await sharp(await base.toBuffer()).resize(1200, 675, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
      const c43 = await sharp(await base.toBuffer()).resize(1200, 900, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
      const f169 = cachePath(`p5/images/post-${p.i}-169.webp`); const f43 = cachePath(`p5/images/post-${p.i}-43.webp`);
      const { writeFileSyncSafe } = await import("./lib/util.mjs");
      (await import("node:fs")).writeFileSync(f169, c169); (await import("node:fs")).writeFileSync(f43, c43);
      meta.file169 = `p5/images/post-${p.i}-169.webp`; meta.file43 = `p5/images/post-${p.i}-43.webp`;
      meta.cropBytes = c169.length + c43.length;
      if (c169.length > 150_000) meta.warn = "169 crop >150KB";
    }
  } catch (e) { meta.fetchError = String(e.message).slice(0, 80); }
  return meta;
}
const { mkdirSync } = await import("node:fs");
mkdirSync(cachePath("p5/images"), { recursive: true });
const coverMetas = (await pool(coverPosts.map((p) => () => processCover(p)), 4, "covers"))).filter(Boolean);
ledger.usedIds = [...used];
ledger.images = coverMetas;
writeCache("p5/image-ledger.json", ledger);

// ── 4. avatars: deterministic illustrated SVG (no real people), imagegen if configured ──
let imagegenOK = false;
if (env.DEMO_IMAGEGEN_MODEL) {
  try {
    const r = await fetch(env.DEMO_LLM_BASE_URL.replace(/\/+$/, "") + "/images/generations", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.DEMO_LLM_API_KEY}` }, body: JSON.stringify({ model: env.DEMO_IMAGEGEN_MODEL, prompt: "simple flat illustration avatar of an abstract fox, warm palette", size: "512x512" }) });
    imagegenOK = r.ok; // capability probe only — lean pilot uses SVG for all (recorded)
  } catch { imagegenOK = false; }
}
const PALETTES = [["#0f766e", "#ccfbf1"], ["#7c3aed", "#ede9fe"], ["#b45309", "#fef3c7"], ["#be185d", "#fce7f3"], ["#1d4ed8", "#dbeafe"], ["#4d7c0f", "#ecfccb"], ["#b91c1c", "#fee2e2"], ["#0e7490", "#cffafe"]];
const activeHandles = new Set(readJson(".demo-world-cache/p3/post-plan.jsonl").toString().split("\n").map((l) => { try { return JSON.parse(l).author; } catch { return ""; } }).filter((h) => h && h !== "devtest"));
const avatars = [];
let avatarSVGs = 0;
for (const m of members) {
  if (!m.hasAvatar) { avatars.push({ handle: m.handle, kind: "default" }); continue; }
  const active = activeHandles.has(m.handle);
  if (!active) { avatars.push({ handle: m.handle, kind: active ? "svg" : "default-pilot" }); continue; } // pilot: SVG for active only
  const h = m.handle; const seed = [...h].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [fg, bg] = PALETTES[seed % PALETTES.length];
  const initials = (m.name || h).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="48" fill="${bg}"/><circle cx="128" cy="104" r="44" fill="${fg}" opacity="0.85"/><text x="128" y="200" font-family="system-ui,sans-serif" font-size="56" font-weight="700" fill="${fg}" text-anchor="middle">${initials}</text></svg>`;
  const f = `p5/avatars/${h}.svg`;
  (await import("node:fs")).writeFileSync(cachePath(f), svg);
  avatars.push({ handle: h, kind: "illustrated-svg", brief: m.avatarBrief, file: f });
  avatarSVGs++;
}
writeCache("p5/avatars.json", avatars);
const coverOK = coverMetas.filter((m) => !m.fetchError);
writeCache("p5/images-summary.json", {
  coverPosts: coverPosts.length, coversFetched: coverOK.length, fetchErrors: coverMetas.length - coverOK.length,
  sources: coverOK.reduce((a, m) => { const k = m.id.split(":")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {}),
  uniqueIds: new Set(coverMetas.map((m) => m.id)).size, oversize: coverMetas.filter((m) => m.warn).length,
  avatarsSvg: avatarSVGs, avatarsDefault: avatars.filter((a) => a.kind.startsWith("default")).length, imagegenEndpoint: imagegenOK ? "available (pilot used SVG; full run may use it)" : "unavailable/failed → illustrated-only (spec P5.3 fallback, reported)",
});
logStats("p5");
console.log("images:", JSON.stringify(readJson(".demo-world-cache/p5/images-summary.json")));
export {};

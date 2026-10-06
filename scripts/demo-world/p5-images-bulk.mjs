#!/usr/bin/env node
/** P5-BULK — covers for flagged-but-unfilled posts (581 after the pilot's 94) + avatar top-up.
 * Append-only to the pilot ledger (pilot metas untouched); resume-safe (skips postI already present).
 * Founder rules: relevance first, no repeats across the whole ledger, covers not forced —
 * a post with no unused relevant match is recorded coverless. Sourcing chain:
 * Unsplash (≤45 calls/run) → Pixabay (≤90/run) → ArtIC (art/design posts only) → Commons (permissive
 * CC only, serially paced). Priority order = most-likely-to-rank first (quality tier, then cover-
 * heavy type, then recency) so the quota-bound best sources go to the posts that will rank on top. */
import { readFileSync, existsSync, writeFileSync, renameSync, mkdirSync, readdirSync } from "node:fs";
import { rng, pick, shuffle, readJson, cachePath, loadEnv } from "./lib/util.mjs";

const posts = readFileSync(".demo-world-cache/p3/posts.jsonl", "utf8").trim().split("\n").map((p) => JSON.parse(p));
const gt = readJson(".demo-world-cache/p3/ground-truth-posts.json");
const gtByI = new Map(gt.map((g) => [g.i, g]));
const planRows = readFileSync(cachePath("p3/post-plan.jsonl"), "utf8").trim().split("\n").map(JSON.parse);
const planByIndex = new Map(planRows.map((l, ix) => [ix, l]));
const members = readFileSync(".demo-world-cache/p2/members.jsonl", "utf8").trim().split("\n").map(JSON.parse);
const R = rng(50006);
const env = loadEnv();

// ── ledger (append-only) ─────────────────────────────────────────────
const RETRY = process.argv.includes("--retry-coverless");
const COMMONS_ONLY = process.argv.includes("--commons-only");
const ledgerPath = cachePath("p5/image-ledger.json");
const ledger = readJson(".demo-world-cache/p5/image-ledger.json");
const filledBefore = ledger.images.filter((m) => m.file169 && !m.coverless && !m.fetchError).length;
if (RETRY) {
  // failed/coverless metas come out of the ledger and back into play; filled ones stay forever
  const keep = ledger.images.filter((m) => m.file169 && !m.coverless && !m.fetchError);
  console.log(`p5-bulk: retry mode — keeping ${keep.length} filled, re-opening ${ledger.images.length - keep.length}`);
  ledger.images = keep;
  const tmp = ledgerPath + ".tmp";
  writeFileSync(tmp, JSON.stringify({ usedIds: ledger.usedIds, images: keep }));
  renameSync(tmp, ledgerPath);
}
const ledIdx = new Set(ledger.images.map((m) => m.postI));
const used = new Set(ledger.usedIds);
const newMetas = [];
const saveLedger = () => {
  const all = { usedIds: [...used], images: [...ledger.images, ...newMetas] };
  const tmp = ledgerPath + ".tmp";
  writeFileSync(tmp, JSON.stringify(all));
  renameSync(tmp, ledgerPath);
};

// ── priority order: likely-to-rank first ────────────────────────────
const QTIER = { great: 0, good: 1, mediocre: 2, poor: 3 };
const TYPERANK = { showcase: 0, review: 0, news: 0, compare: 0 };
const STOP = new Set(['the','a','an','and','or','for','with','my','your','how','why','what','is','are','to','of','in','on','it','i','we','you','this','that','after','before','using','been','have']);
const toDo = posts
  .map((p, i) => ({ ...p, i }))
  .filter((p) => p.cover && !ledIdx.has(p.i))
  .sort((a, b) =>
    (QTIER[gtByI.get(a.i)?.quality ?? "good"] - QTIER[gtByI.get(b.i)?.quality ?? "good"]) ||
    ((TYPERANK[a.type] ?? 1) - (TYPERANK[b.type] ?? 1)) ||
    (b.dayOffsetMs - a.dayOffsetMs)
  );
console.log(`p5-bulk: ${toDo.length} covers to fill (ledger has ${filledBefore} filled${COMMONS_ONLY ? ", commons-only pass" : ""})`);

// ── sourcing (same chain + caps as the pilot pass) ───────────────────
let unsplashCalls = 0, pixabayCalls = 0, articCalls = 0;
async function unsplashSearch(q, page = 1) {
  if (!env.Unsplash_Access_key || unsplashCalls >= 45) return [];
  unsplashCalls++;
  const r = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(q)}&per_page=10&orientation=landscape&page=${page}`, { headers: { Authorization: `Client-ID ${env.Unsplash_Access_key}` }, signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r?.ok) return [];
  const j = await r.json().catch(() => ({}));
  return (j.results ?? []).map((x) => ({ id: `unsplash:${x.id}`, url: x.urls?.regular, w: x.width, h: x.height, credit: `Photo by ${x.user?.name} on Unsplash`, license: "Unsplash License", source: x.links?.html }));
}
async function pixabaySearch(q, page = 1) {
  if (!env.pixabay_API_KEY || pixabayCalls > 90) return [];
  pixabayCalls++;
  const r = await fetch(`https://pixabay.com/api/?key=${encodeURIComponent(env.pixabay_API_KEY)}&q=${encodeURIComponent(q)}&per_page=10&image_type=photo&orientation=horizontal&safesearch=true&page=${page}`, { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r?.ok) return [];
  const j = await r.json().catch(() => ({}));
  return (j.hits ?? []).map((x) => ({ id: `pixabay:${x.id}`, url: x.largeImageURL, w: x.imageWidth, h: x.imageHeight, credit: `Image by ${x.user} on Pixabay`, license: "Pixabay Content License", source: `https://pixabay.com/photos/${x.id}/` }));
}
let commonsChain = Promise.resolve(); // serial + paced — be polite to Wikimedia
function commonsSearch(q, offset = 0) {
  const run = async () => {
    await new Promise((res) => setTimeout(res, 150));
    const u = new URL("https://commons.wikimedia.org/w/api.php");
    u.searchParams.set("action", "query"); u.searchParams.set("format", "json");
    u.searchParams.set("generator", "search"); u.searchParams.set("gsrsearch", q);
    if (offset > 0) u.searchParams.set("gsroffset", String(offset));
    u.searchParams.set("gsrnamespace", "6"); u.searchParams.set("gsrlimit", "30");
    u.searchParams.set("prop", "imageinfo"); u.searchParams.set("iiprop", "url|extmetadata|size|mime");
    const r = await fetch(u, { headers: { "user-agent": "CE-MVP-demo-world/0.1 (local dev)" }, signal: AbortSignal.timeout(20000) }).catch(() => null);
    if (!r?.ok) return [];
    const j = await r.json().catch(() => ({}));
    const pages = Object.values(j.query?.pages ?? {});
    const out = [];
    for (const p of pages) {
      const ii = p.imageinfo?.[0]; if (!ii?.url) continue;
      if (!/image\/(jpeg|png|webp)$/.test(ii.mime ?? "")) continue; // no tiff/svg/pdf originals
      if ((ii.width ?? 0) * (ii.height ?? 0) > 40e6) continue;
      const meta = ii.extmetadata ?? {};
      const lic = String(meta.LicenseShortName?.value ?? "");
      if (!/cc0|cc by|cc by-sa|public domain/i.test(lic)) continue;
      out.push({ id: `commons:${p.pageid}`, url: ii.url, w: ii.width, h: ii.height, credit: `${meta.Artist?.value?.replace(/<[^>]+>/g, "").trim() || "Unknown"} via Wikimedia Commons`, license: lic, source: ii.descriptionurl ?? "https://commons.wikimedia.org" });
    }
    return out;
  };
  const next = commonsChain.then(run, run);
  commonsChain = next.catch(() => {});
  return next;
}
async function articPick() {
  if (articCalls > 30) return null;
  articCalls++;
  const r = await fetch("https://www.artic.edu/api/v1/artworks?fields=id,title,image_id,artist_title,license_title&page=" + (1 + Math.floor(R() * 40)) + "&limit=20", { signal: AbortSignal.timeout(15000) }).catch(() => null);
  if (!r?.ok) return null;
  const j = await r.json().catch(() => ({}));
  const ok = (j.data ?? []).filter((a) => a.image_id && a.title);
  if (!ok.length) return null;
  const a = pick(R, ok);
  return { id: `artic:${a.id}`, url: `https://www.artic.edu/iiif/2/${a.image_id}/full/1200,/0/default.jpg`, w: 1200, h: 900, credit: `"${a.title}" by ${a.artist_title} (Art Institute of Chicago)`, license: a.license_title ?? "public domain (ArtIC)", source: `https://www.artic.edu/artworks/${a.id}` };
}

// ── sharp (pnpm store fallback, same as pilot) ───────────────────────
let sharp = null; try { sharp = (await import("sharp")).default; } catch {
  try {
    const pn = "node_modules/.pnpm";
    const dir = readdirSync(pn).find((d) => d.startsWith("sharp@"));
    if (dir) {
      const { pathToFileURL } = await import("node:url");
      sharp = (await import(pathToFileURL(`${pn}/${dir}/node_modules/sharp/dist/index.mjs`).href)).default;
    }
  } catch { console.log("sharp unavailable — originals stored, crops deferred"); }
}
mkdirSync(cachePath("p5/images"), { recursive: true });
mkdirSync(cachePath("p5/avatars"), { recursive: true });

// ── query v2: topic-aware VISUAL terms ───────────────────────────────
// Stock/Commons catalogs don't index niche AI-tool names; a cover is relevant when it
// depicts the post's SUBJECT visually (audio post → studio mic). Deterministic map,
// no forcing: if no unused relevant match exists the post still ends coverless.
const VISUAL = [
  [/(video|youtube|shorts|premiere|editing|clip|film|pika|runway|sora)/i, "video editing workspace"],
  [/(podcast|audio|voice|music|suno|microphone|elevenlabs|tts)/i, "podcast microphone studio"],
  [/(seo|search|analytics|traffic|keyword|google)/i, "laptop analytics charts"],
  [/(logo|brand|identity|figma|design|illustrat|midjourney|art|dall)/i, "graphic design desk"],
  [/(photo|camera|lightroom|photoshop|image|imagen)/i, "photographer camera desk"],
  [/(writing|blog|novel|book|author|story|draft|copywriting)/i, "writer desk notebook"],
  [/(course|teaching|student|tutorial|education|learn)/i, "online course laptop"],
  [/(newsletter|email|subscriber|substack)/i, "email laptop coffee"],
  [/(automation|workflow|zapier|api|code|develop|build|sdk|agent)/i, "developer dual monitor"],
  [/(freelance|client|pricing|invoice|business|shop|store|sell)/i, "freelancer home office"],
  [/(chat|prompt|llm|gpt|claude|gemini|\bai\b|llama)/i, "person laptop screen glow"],
  [/(avatar|character|vtuber|face|portrait)/i, "portrait colorful studio light"],
];
const TYPE_VISUAL = { showcase: "creative workspace desk", review: "desk laptop coffee", news: "technology desk laptop", compare: "two laptops table", help: "person thinking laptop", debate: "people discussion table", list: "organized desk notebook", spark: "sunrise workspace morning" };
function visualQuery(p) {
  const topic = String(gtByI.get(p.i)?.topic ?? "").replace(/-/g, " ");
  const hay = p.title + " " + topic;
  for (const [re, q] of VISUAL) if (re.test(hay)) return q;
  return TYPE_VISUAL[p.type] ?? "creative workspace desk";
}
async function processCover(p) {
  const kw = visualQuery(p);
  const brief = { keywords: kw, brief: kw + ' — ' + p.type + ' post cover, no text/logos/people' };
  const planRow = planByIndex.get(p.i) ?? {};
  const isArtDesign = planRow.niche === "design" || /art|illustrat|paint|design/i.test(p.title);
  // unique per-post subject keywords (round-1 proven on stock sources) + shared visual query
  // with page/variant rotation as fallback — repeated shared queries can't exhaust their
  // first result page and force false coverless marks
  const words = p.title.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
  const v1 = [...new Set(words)].slice(0, 3).join(' ') || kw;
  const page = 1 + (p.i % 4);
  const VARIANTS = ["", "close up", "flat lay", "moody", "bright", "minimal", "cozy", "overhead", "warm light", "night"];
  const variant = VARIANTS[p.i % VARIANTS.length];
  const uq = variant ? kw + " " + variant : kw;
  const meta = { postI: p.i, type: p.type, ...brief };
  let chosen = null;
  if (!COMMONS_ONLY) {
    for (const q of [v1, uq]) {
      for (const cand of shuffle(R, await unsplashSearch(q, page))) { if (!used.has(cand.id)) { chosen = cand; break; } }
      if (chosen) break;
    }
    if (!chosen) for (const q of [v1, kw]) {
      for (const cand of shuffle(R, await pixabaySearch(q, page))) { if (!used.has(cand.id)) { chosen = cand; break; } }
      if (chosen) break;
    }
  }
  if (!chosen && isArtDesign) { const a = await articPick(); if (a && !used.has(a.id)) chosen = a; }
  if (!chosen) {
    const tv = TYPE_VISUAL[p.type] ?? "creative workspace desk";
    for (const q of [kw, tv]) {
      for (const cand of shuffle(R, await commonsSearch(q))) { if (!used.has(cand.id)) { chosen = cand; break; } }
      if (chosen) break;
    }
  }
  if (!chosen) return { ...meta, coverless: true, reason: "no unused relevant match" };
  used.add(chosen.id);
  Object.assign(meta, chosen);
  try {
    const r = await fetch(chosen.url, { signal: AbortSignal.timeout(30000) });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const len = Number(r.headers.get("content-length") ?? 0);
    if (len > 15e6) { return { ...meta, coverless: true, reason: "oversize original" }; }
    const buf = Buffer.from(await r.arrayBuffer());
    meta.originalBytes = buf.length;
    if (sharp) {
      const base = sharp(buf).resize(1200, null, { withoutEnlargement: true });
      const c169 = await sharp(await base.toBuffer()).resize(1200, 675, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
      const c43 = await sharp(await base.toBuffer()).resize(1200, 900, { fit: "cover" }).webp({ quality: 72 }).toBuffer();
      const f169 = cachePath(`p5/images/post-${p.i}-169.webp`); const f43 = cachePath(`p5/images/post-${p.i}-43.webp`);
      writeFileSync(f169, c169); writeFileSync(f43, c43);
      meta.file169 = `p5/images/post-${p.i}-169.webp`; meta.file43 = `p5/images/post-${p.i}-43.webp`;
      meta.cropBytes = c169.length + c43.length;
      meta.uploadContentType = "image/webp";
      if (c169.length > 150_000) meta.warn = "169 crop >150KB";
    }
  } catch (e) { meta.fetchError = String(e.message ?? e).slice(0, 80); }
  return meta;
}

// ── run (pool of 3, ledger checkpointed every 15) ────────────────────
let done = 0, sinceSave = 0;
async function worker(queue) {
  for (;;) {
    const p = queue.shift();
    if (!p) return;
    const meta = await processCover(p);
    newMetas.push(meta);
    if (meta.id) used.add(meta.id);
    done++; sinceSave++;
    if (done % 25 === 0) console.log(`p5-bulk: ${done}/${toDo.length} (unsplash ${unsplashCalls}, pixabay ${pixabayCalls}, artic ${articCalls})`);
    if (sinceSave >= 15) { saveLedger(); sinceSave = 0; }
  }
}
const queue = [...toDo];
await Promise.all([worker(queue), worker(queue), worker(queue)]);
saveLedger();
const filled = newMetas.filter((m) => m.file169);
const coverless = newMetas.filter((m) => m.coverless || m.fetchError || !m.file169);
console.log(`p5-bulk covers: ${filled.length} filled, ${coverless.length} coverless/failed of ${toDo.length}; sources=${JSON.stringify(filled.reduce((a, m) => { const k = m.id.split(":")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {}))}`);

// ── avatar top-up: active bulk authors with hasAvatar get the same SVG treatment ──
const activeHandles = new Set(planRows.map((l) => l.author).filter((h) => h && h !== "devtest"));
const AVATARS_ALL = process.argv.includes("--avatars-all"); // final run: every hasAvatar member gets an SVG, not just active authors
const memberByHandle = new Map(members.map((m) => [m.handle, m]));
const PALETTES = [["#0f766e", "#ccfbf1"], ["#7c3aed", "#ede9fe"], ["#b45309", "#fef3c7"], ["#be185d", "#fce7f3"], ["#1d4ed8", "#dbeafe"], ["#4d7c0f", "#ecfccb"], ["#b91c1c", "#fee2e2"], ["#0e7490", "#cffafe"]];
const avatars = readJson(".demo-world-cache/p5/avatars.json");
let addedSvg = 0;
for (const a of avatars) {
  if (a.kind === "illustrated-svg") continue;
  const m = memberByHandle.get(a.handle);
  if (!m?.hasAvatar) continue; // no-avatar members stay default (founder edge case)
  if (!AVATARS_ALL && !activeHandles.has(a.handle)) continue;
  const h = a.handle; const seed = [...h].reduce((x, c) => x + c.charCodeAt(0), 0);
  const [fg, bg] = PALETTES[seed % PALETTES.length];
  const initials = (m.name || h).split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" rx="48" fill="${bg}"/><circle cx="128" cy="104" r="44" fill="${fg}" opacity="0.85"/><text x="128" y="200" font-family="system-ui,sans-serif" font-size="56" font-weight="700" fill="${fg}" text-anchor="middle">${initials}</text></svg>`;
  const f = `p5/avatars/${h}.svg`;
  writeFileSync(cachePath(f), svg);
  a.kind = "illustrated-svg"; a.file = f; if (m.avatarBrief) a.brief = m.avatarBrief;
  addedSvg++;
}
const avTmp = cachePath("p5/avatars.json.tmp");
writeFileSync(avTmp, JSON.stringify(avatars));
renameSync(avTmp, cachePath("p5/avatars.json"));
console.log(`p5-bulk avatars: +${addedSvg} svg for active bulk authors (total svg ${avatars.filter((a) => a.kind === "illustrated-svg").length}/${avatars.length})`);

const summary = readJson(".demo-world-cache/p5/images-summary.json");
summary.bulk = {
  flagged: posts.filter((p) => p.cover).length, pilotFilled: filledBefore, bulkToDo: toDo.length,
  bulkFilled: filled.length, coverlessOrFailed: coverless.length,
  sources: filled.reduce((a, m) => { const k = m.id.split(":")[0]; a[k] = (a[k] ?? 0) + 1; return a; }, {}),
  avatarsSvgAdded: addedSvg,
};
const sTmp = cachePath("p5/images-summary.json.tmp");
writeFileSync(sTmp, JSON.stringify(summary));
renameSync(sTmp, cachePath("p5/images-summary.json"));
console.log("p5-bulk: complete");

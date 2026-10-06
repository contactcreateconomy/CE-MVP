// LLM client — OpenAI-compatible (DEMO_LLM_*), with disk cache + retries + concurrency.
// Keys are read from env and NEVER printed. Logs show counts only.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { loadEnv, ROOT } from "./util.mjs";

const env = loadEnv();
const BASE = (env.DEMO_LLM_BASE_URL || "").replace(/\/+$/, "");
const KEY = env.DEMO_LLM_API_KEY || "";
const MODEL = env.DEMO_LLM_MODEL || "";
export const CONCURRENCY = Math.max(1, Number(env.DEMO_LLM_MAX_CONCURRENCY || 8));
if (!BASE || !KEY || !MODEL) { console.error("llm.mjs: DEMO_LLM_BASE_URL / DEMO_LLM_API_KEY / DEMO_LLM_MODEL missing"); process.exit(1); }

const CACHE_DIR = path.join(ROOT, ".demo-world-cache", "llm-cache");
mkdirSync(CACHE_DIR, { recursive: true });

export const stats = { calls: 0, cacheHits: 0, retries: 0, promptTokens: 0, completionTokens: 0, fail: 0 };

function cacheKey(messages, opts) {
  return createHash("sha256").update(JSON.stringify({ MODEL, messages, max: opts.maxTokens, t: opts.temperature })).digest("hex").slice(0, 24);
}

/** One chat call. Returns assistant content string. Throws after N retries. */
export async function chat(messages, opts = {}) {
  const maxTokens = opts.maxTokens ?? 2048;
  const temperature = opts.temperature ?? 0.8;
  const ck = cacheKey(messages, { maxTokens, temperature });
  const cf = path.join(CACHE_DIR, ck + ".json");
  if (existsSync(cf)) { stats.cacheHits++; return JSON.parse(readFileSync(cf, "utf8")).content; }

  const url = BASE.endsWith("/chat/completions") ? BASE : BASE + "/chat/completions";
  let lastErr = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${KEY}` },
        body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature }),
      });
      if (r.status === 429 || r.status >= 500) { stats.retries++; await new Promise((res) => setTimeout(res, 1500 * 2 ** attempt + Math.random() * 500)); continue; }
      const j = await r.json().catch(() => ({}));
      const content = j.choices?.[0]?.message?.content;
      if (r.status !== 200 || typeof content !== "string") throw new Error(`HTTP ${r.status} ${JSON.stringify(j).slice(0, 120)}`);
      stats.calls++;
      stats.promptTokens += j.usage?.prompt_tokens ?? 0;
      stats.completionTokens += j.usage?.completion_tokens ?? 0;
      writeFileSync(cf, JSON.stringify({ content }));
      return content;
    } catch (e) { lastErr = e; stats.retries++; await new Promise((res) => setTimeout(res, 1000 * 2 ** attempt)); }
  }
  stats.fail++;
  throw lastErr ?? new Error("llm call failed");
}

/** Parse a JSON array/object out of a model reply (handles ``` fences). */
export function parseJson(txt) {
  const cleaned = txt.replace(/```(?:json)?/gi, "").trim();
  const start = Math.min(...["[", "{"].map((c) => { const i = cleaned.indexOf(c); return i === -1 ? Infinity : i; }));
  const open = cleaned[start];
  const close = open === "[" ? "]" : "}";
  const end = cleaned.lastIndexOf(close);
  if (!open || end === -1 || end <= start) throw new Error("no JSON in reply");
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Run tasks with bounded concurrency; returns results (null on error, errors logged by key). */
export async function pool(tasks, concurrency = CONCURRENCY, label = "") {
  const results = new Array(tasks.length);
  let i = 0, done = 0;
  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, async () => {
    while (i < tasks.length) {
      const idx = i++;
      try { results[idx] = await tasks[idx](); }
      catch (e) { results[idx] = null; console.error(`  [task ${idx}] failed: ${String(e.message).slice(0, 100)}`); }
      done++;
      if (done % 50 === 0 || done === tasks.length) console.log(`  ${label} ${done}/${tasks.length}`);
    }
  });
  await Promise.all(workers);
  return results;
}

/** JSON-array chat helper with retry-and-repair (one repair round). */
export async function chatJsonArray(messages, opts = {}) {
  const txt = await chat(messages, opts);
  try { return parseJson(txt); } catch {
    const repair = await chat([...messages, { role: "assistant", content: txt }, { role: "user", content: "Your reply was not valid JSON. Reply again with ONLY the valid JSON array, no prose, no code fences." }], { ...opts, temperature: 0.2, maxTokens: opts.maxTokens ?? 2048 });
    return parseJson(repair);
  }
}

export function logStats(label) {
  console.log(`[llm:${label}] calls=${stats.calls} cacheHits=${stats.cacheHits} retries=${stats.retries} fails=${stats.fail} tokens≈${stats.promptTokens + stats.completionTokens} (in ${stats.promptTokens} / out ${stats.completionTokens})`);
  return { calls: stats.calls, promptTokens: stats.promptTokens, completionTokens: stats.completionTokens, fails: stats.fail, cacheHits: stats.cacheHits };
}

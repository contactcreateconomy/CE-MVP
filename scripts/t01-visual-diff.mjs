#!/usr/bin/env node
/**
 * S00-T01 evidence harness — captures the same 8 views (forum /feed +
 * admin console at 390/1440 in dark/light) twice: once on the pre-change
 * tree ("before") and once after ("after"), then proves byte-identical
 * PNGs. Usage: node scripts/t01-visual-diff.mjs before|after|compare
 * Uses the system Edge channel (Playwright CDN download fails on this
 * network — same as capture-baselines.mjs).
 */
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, existsSync, writeFileSync } from "node:fs";
import path from "node:path";

const MODE = process.argv[2];
const OUT = path.resolve(process.argv[3] ?? "ak-redesign/specs/S00-evidence/T01");
mkdirSync(OUT, { recursive: true });

const VIEWS = [
  { app: "forum", url: "http://localhost:3000/feed" },
  { app: "admin", url: "http://localhost:3001/" },
];
const SIZES = [
  { name: "390", width: 390, height: 844 },
  { name: "1440", width: 1440, height: 900 },
];
const THEMES = ["dark", "light"];

const noConsentBanner = () => sessionStorage.setItem("cmp.dismissed", "1");

async function dismissChrome(page) {
  const btn = page.getByRole("button", { name: /^(Save choices|Essentials only)$/ });
  if ((await btn.count()) > 0) await btn.first().click({ timeout: 2000 }).catch(() => {});
  await page.addStyleTag({
    content: `nextjs-portal, [data-nextjs-dev-tools-button], [data-next-badge] { display: none !important; }`,
  }).catch(() => {});
}

async function shoot(prefix) {
  const browser = await chromium.launch(
    process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : { channel: "msedge" },
  );
  const files = [];
  try {
    for (const theme of THEMES) {
      const context = await browser.newContext();
      await context.addInitScript(noConsentBanner);
      await context.addInitScript((t) => {
        try { window.localStorage.setItem("theme", t); } catch {}
      }, theme);
      for (const view of VIEWS) {
        for (const size of SIZES) {
          const page = await context.newPage();
          await page.setViewportSize({ width: size.width, height: size.height });
          await page.goto(view.url, { waitUntil: "domcontentloaded" });
          await page.waitForTimeout(3500); // Convex subscribe + render settle
          await dismissChrome(page);
          await page.waitForTimeout(400);
          const file = path.join(OUT, `${prefix}-${view.app}-${size.name}-${theme}.png`);
          await page.screenshot({ path: file });
          files.push(file);
          console.log(`  [✓] ${path.basename(file)}`);
          await page.close();
        }
      }
      await context.close();
    }
  } finally {
    await browser.close();
  }
  // byte-hash manifest — identical bytes = pixel-identical
  const manifest = {};
  for (const f of files) {
    manifest[path.basename(f)] = createHash("sha256").update(readFileSync(f)).digest("hex");
  }
  writeFileSync(path.join(OUT, `${prefix}-hashes.json`), JSON.stringify(manifest, null, 2));
  console.log(`  [✓] ${prefix}-hashes.json (${files.length} files)`);
}

function compare() {
  const beforePath = path.join(OUT, "before-hashes.json");
  const afterPath = path.join(OUT, "after-hashes.json");
  if (!existsSync(beforePath) || !existsSync(afterPath)) {
    console.error("missing before/after manifests");
    process.exit(1);
  }
  const before = JSON.parse(readFileSync(beforePath, "utf8"));
  const after = JSON.parse(readFileSync(afterPath, "utf8"));
  const strip = (k) => k.replace(/^(before|after)-/, "");
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)].map(strip))].sort();
  let mismatches = 0;
  for (const key of keys) {
    const b = before[`before-${key}`];
    const a = after[`after-${key}`];
    if (b === a) {
      console.log(`  [✓] ${key}: identical (${String(b).slice(0, 12)}…)`);
    } else {
      mismatches += 1;
      console.error(`  [✗] ${key}: DIFFERS (before ${String(b).slice(0, 12)} vs after ${String(a).slice(0, 12)})`);
    }
  }
  if (mismatches > 0) {
    console.error(`\n${mismatches} view(s) not pixel-identical.`);
    process.exit(1);
  }
  console.log(`\nall ${keys.length} views BYTE-IDENTICAL (pixel-identical) before → after.`);
}

if (MODE === "before" || MODE === "after") {
  await shoot(MODE);
} else if (MODE === "compare") {
  compare();
} else {
  console.error("usage: node scripts/t01-visual-diff.mjs before|after|compare");
  process.exit(1);
}

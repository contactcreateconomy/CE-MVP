#!/usr/bin/env node
/**
 * S00-T03 evidence — /lab/utilities in both themes (page theme dark + light
 * at 390 and 1440), plus the fallback proofs:
 *   - prefers-reduced-motion: reduce  → .pulse-live/.glow-celebrate animation none
 *     (computed-style asserted; static glow stays)
 *   - prefers-reduced-transparency: reduce → .glass-* solid bg + no blur
 *     (computed-style asserted + screenshot)
 * Writes to ak-redesign/specs/S00-evidence/T03/ and prints a summary meant
 * for the BUILD report. Edge channel (Playwright CDN unavailable here).
 */
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const BASE = process.env.T03_BASE ?? "http://localhost:3000";
const OUT = path.resolve("ak-redesign/specs/S00-evidence/T03");
mkdirSync(OUT, { recursive: true });
const results = [];

const noConsentBanner = () => sessionStorage.setItem("cmp.dismissed", "1");

async function newPage(browser, { theme, size, media = {} }) {
  const context = await browser.newContext();
  await context.addInitScript(noConsentBanner);
  await context.addInitScript((t) => {
    try { window.localStorage.setItem("theme", t); } catch {}
  }, theme);
  const page = await context.newPage();
  if (media.reducedMotion) {
    await page.emulateMedia({ reducedMotion: media.reducedMotion });
  }
  if (media.reducedTransparency) {
    // playwright's emulateMedia({reducedTransparency}) does not wire through
    // on this Edge build — the raw CDP feature emulation does (verified:
    // matchMedia true + opaque background). Use it directly.
    const cdp = await context.newCDPSession(page);
    await cdp.send("Emulation.setEmulatedMedia", {
      features: [{ name: "prefers-reduced-transparency", value: media.reducedTransparency }],
    });
  }
  await page.setViewportSize(size);
  return { context, page };
}

async function shoot(browser, name, opts) {
  const { context, page } = await newPage(browser, opts);
  await page.goto(`${BASE}/lab/utilities`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);
  const assertions = {};
  if (name.includes("reduced-motion")) {
    assertions.pulseAnimation = await page
      .getByTestId("pulse-live-demo").first()
      .evaluate((el) => getComputedStyle(el).animationName);
    assertions.pulseStaticGlow = await page
      .getByTestId("pulse-live-demo").first()
      .evaluate((el) => getComputedStyle(el).boxShadow.slice(0, 60));
  }
  if (name.includes("reduced-transparency")) {
    assertions.chromeBackdrop = await page
      .getByTestId("glass-chrome-demo").first()
      .evaluate((el) => getComputedStyle(el).backdropFilter);
    assertions.chromeBg = await page
      .getByTestId("glass-chrome-demo").first()
      .evaluate((el) => getComputedStyle(el).backgroundColor);
  }
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await context.close();
  results.push({ name, assertions });
  console.log(`  [✓] ${name}.png` + (Object.keys(assertions).length ? ` ${JSON.stringify(assertions)}` : ""));
}

const browser = await chromium.launch(
  process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : { channel: "msedge" },
);
try {
  // both page themes, phone + desktop
  for (const theme of ["dark", "light"]) {
    for (const size of [
      { name: "390", width: 390, height: 844 },
      { name: "1440", width: 1440, height: 900 },
    ]) {
      await shoot(browser, `utilities-${theme}-${size.name}`, { theme, size });
    }
  }
  // fallbacks (390, dark page theme)
  await shoot(browser, "utilities-reduced-motion-390", {
    theme: "dark",
    size: { width: 390, height: 844 },
    media: { reducedMotion: "reduce" },
  });
  await shoot(browser, "utilities-reduced-transparency-390", {
    theme: "dark",
    size: { width: 390, height: 844 },
    media: { reducedTransparency: "reduce" },
  });
} finally {
  await browser.close();
}

// verdict
let failures = 0;
for (const r of results) {
  if (r.name.includes("reduced-motion")) {
    if (r.assertions.pulseAnimation !== "none") {
      console.error(`  [✗] reduced-motion: pulse animation is "${r.assertions.pulseAnimation}", expected "none"`);
      failures += 1;
    } else {
      console.log(`  [✓] reduced-motion: .pulse-live animation=none, static glow="${r.assertions.pulseStaticGlow}…"`);
    }
  }
  if (r.name.includes("reduced-transparency")) {
    const solid = r.assertions.chromeBg && !/\/\s*0?\.\d+\)/.test(r.assertions.chromeBg);
    if (r.assertions.chromeBackdrop !== "none" || !solid) {
      console.error(`  [✗] reduced-transparency: backdrop="${r.assertions.chromeBackdrop}" bg="${r.assertions.chromeBg}" — expected backdrop none + OPAQUE bg`);
      failures += 1;
    } else {
      console.log(`  [✓] reduced-transparency: .glass-chrome backdrop=none, bg="${r.assertions.chromeBg}" (opaque solid)`);
    }
  }
}
if (failures > 0) process.exit(1);
console.log(`\n6 screenshots + computed-style assertions in ${OUT}`);

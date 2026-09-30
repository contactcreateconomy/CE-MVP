#!/usr/bin/env node
/**
 * S00-T02 fix-round self-verification — every glow value in STYLE-KIT §2.2
 * must equal the exact declaration in packages/design-tokens/tokens.css,
 * for BOTH themes (dark from the .dark block, light from :root).
 * Exact strings, no normalization. Exit 1 on any mismatch.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..",
);
const css = readFileSync(path.join(ROOT, "packages/design-tokens/tokens.css"), "utf8");
const kit = readFileSync(path.join(ROOT, "docs/04-design-system/STYLE-KIT.md"), "utf8");

/** section body: everything between "### 2.2 " and the next "### " */
const section = kit.match(/### 2\.2 Electric Glow System[\s\S]*?(?=\n### )/);
if (!section) {
  console.error("could not locate STYLE-KIT §2.2");
  process.exit(1);
}
const table = section[0];

/** value of --<name> inside a given block (:root or .dark);
 *  returns null when the block doesn't declare it (inheritance) */
function tokenValue(blockRe, name) {
  const block = css.match(blockRe);
  if (!block) throw new Error(`block ${blockRe} not found`);
  const m = block[0].match(new RegExp(`--${name}:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

const TOKENS = ["cta", "active", "focus", "celebrate", "live", "track"];
const CSS_NAMES = { cta: "glow-cta", active: "glow-active", focus: "glow-focus", celebrate: "glow-celebrate", live: "glow-live", track: "glow-track" };

let mismatches = 0;
console.log("STYLE-KIT §2.2 vs tokens.css (exact strings, both themes)\n");
for (const t of TOKENS) {
  const rowRe = new RegExp(`^glow/${t}\\s+.*$`, "m");
  const row = table.match(rowRe);
  if (!row) {
    console.error(`  [✗] glow/${t}: no §2.2 row`);
    mismatches += 1;
    continue;
  }
  const dark = tokenValue(/\.dark\s*\{[\s\S]*?\n\}/, CSS_NAMES[t]);
  const light = tokenValue(/:root\s*\{[\s\S]*?\n\}/, CSS_NAMES[t]);
  for (const [theme, value] of [["dark", dark], ["light", light]]) {
    if (row[0].includes(value)) {
      console.log(`  [✓] glow/${t} ${theme}: "${value}"`);
    } else {
      console.error(`  [✗] glow/${t} ${theme}: §2.2 row does NOT contain the exact tokens.css value "${value}"`);
      console.error(`      row: ${row[0].slice(0, 160)}`);
      mismatches += 1;
    }
  }
}

/** §2.2a glass rows — the blur tokens are theme-invariant (declared on
 *  :root, inherited by .dark), verified as full filter strings. */
const glassSection = kit.match(/### 2\.2a Glass[\s\S]*?(?=\n### )/);
if (!glassSection) {
  console.error("could not locate STYLE-KIT §2.2a");
  process.exit(1);
}
for (const [kitName, cssName] of [
  ["glass/subtle-blur", "glass-subtle-blur"],
  ["glass/strong-blur", "glass-strong-blur"],
]) {
  const row = glassSection[0].match(new RegExp(`^${kitName.replace("/", "\\/")}\\s+.*$`, "m"));
  if (!row) {
    console.error(`  [✗] ${kitName}: no §2.2a row`);
    mismatches += 1;
    continue;
  }
  const root = tokenValue(/:root\s*\{[\s\S]*?\n\}/, cssName);
  const dark = tokenValue(/\.dark\s*\{[\s\S]*?\n\}/, cssName) ?? root; // inherited when undeclared
  if (row[0].includes(root) && row[0].includes(dark)) {
    console.log(`  [✓] ${kitName} (both themes): "${root}"${dark === root ? " (declared :root, inherited by .dark)" : ""}`);
  } else {
    console.error(`  [✗] ${kitName}: §2.2a row does not carry the exact tokens.css value "${root}" (dark: "${dark}")`);
    mismatches += 1;
  }
}
if (mismatches > 0) {
  console.error(`\n${mismatches} mismatch(es).`);
  process.exit(1);
}
console.log("\n0 mismatches — every §2.2 glow value and §2.2a glass blur value is the exact tokens.css string.");

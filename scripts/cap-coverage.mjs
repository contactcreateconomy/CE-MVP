import fs from "node:fs";
import path from "node:path";

const S = path.resolve(import.meta.dirname, "../docs/03-slices");
const files = fs.readdirSync(S).filter(f => f.endsWith(".md"));

const covered = new Set();
for (const f of files) {
  const t = fs.readFileSync(path.join(S, f), "utf8");
  // plain mentions
  for (const m of t.matchAll(/CAP-(\d{3})/g)) covered.add(Number(m[1]));
  // ranges: CAP-286–292 / CAP-286-292 / CAP-120–139 (en/em dash)
  for (const m of t.matchAll(/CAP-(\d{3})\s*[–—-]\s*(\d{1,3})/g)) {
    const a = Number(m[1]);
    const b = a < 100 && Number(m[2]) < 100 ? Number(String(a).slice(0, 1) + m[2].padStart(2, "0")) : Number(String(a).slice(0, 3 - m[2].length) + m[2]);
    for (let i = a; i <= b; i++) covered.add(i);
  }
}

const all = new Set(Array.from({ length: 572 }, (_, i) => i + 1));
const missing = [...all].filter(n => !covered.has(n));
console.log("named+range-covered:", all.size - missing.length, "/", all.size);
console.log("absent:", missing.length, missing.length ? "→ " + missing.map(n => "CAP-" + String(n).padStart(3, "0")).join(", ") : "(none)");

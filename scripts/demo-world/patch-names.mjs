#!/usr/bin/env node
/** Final-run edge-case fix: the casting romanized every member name, so the
 * founder's "non-Latin names" edge case never existed. Give ~18 members across
 * script-bearing countries authentic names in their own script — artifact first
 * (members.jsonl), then a DB patch via demoWorld/importMembers:patchNames.
 * Renamed members' avatar entries reset so the avatar pass regenerates correct
 * initials (their upload markers drop accordingly). */
import { readFileSync, writeFileSync, renameSync } from "node:fs";

const MEMBERS = ".demo-world-cache/p2/members.jsonl";
const members = readFileSync(MEMBERS, "utf8").trim().split("\n").map(JSON.parse);

const POOL = {
  "South Korea": ["김서연", "박지훈", "이수민"],
  China: ["王丽华", "陈嘉明", "林小燕"],
  Greece: ["Γεώργιος Παπαδόπουλος", "Ελένη Δημητρίου", "Νίκος Καραγιάννης"],
  Ukraine: ["Олена Шевченко", "Андрій Бондаренко", "Ірина Мельник"],
  UAE: ["سارة العتيبي", "محمد الحسين", "نور الهدى منصور"],
  Egypt: ["يوسف العماري", "دينا حسن", "خالد مرسي"],
  "Saudi Arabia": ["فهد الدوسري", "ريم القحطاني"],
  Israel: ["יעל כהן", "דוד לוי"],
  Japan: ["佐藤結衣", "高橋健太"],
  India: ["प्रिया शर्मा", "அருள் முருகன்"],
};

const picks = [];
for (const [country, names] of Object.entries(POOL)) {
  const handles = members.filter((m) => m.country === country).map((m) => m.handle).sort();
  handles.slice(0, 2).forEach((h, i) => picks.push({ handle: h, name: names[i % names.length], country }));
}
const byHandle = new Map(picks.map((p) => [p.handle, p]));
for (const m of members) if (byHandle.has(m.handle)) m.name = byHandle.get(m.handle).name;

const tmp = MEMBERS + ".tmp";
writeFileSync(tmp, members.map((m) => JSON.stringify(m)).join("\n") + "\n");
renameSync(tmp, MEMBERS);

// avatar entries for renamed handles: reset so --avatars-all regenerates with
// correct initials; drop their upload markers so stage 2b re-uploads
const AV = ".demo-world-cache/p5/avatars.json";
const avatars = JSON.parse(readFileSync(AV, "utf8"));
const renamedAvs = new Set();
for (const a of avatars) {
  if (!byHandle.has(a.handle)) continue;
  renamedAvs.add(a.handle);
  if (a.kind === "illustrated-svg") { a.kind = "default-pilot"; delete a.file; }
}
renameSync((() => { const t = AV + ".tmp"; writeFileSync(t, JSON.stringify(avatars)); return t; })(), AV);
const UD = ".demo-world-cache/p5/upload-done.jsonl";
const keep = readFileSync(UD, "utf8").trim().split("\n").filter((l) => !renamedAvs.has(l.replace(/^av-/, "")));
renameSync((() => { const t = UD + ".tmp"; writeFileSync(t, keep.join("\n") + "\n"); return t; })(), UD);

const rows = picks.map((p) => ({ userEmail: `${p.handle}@demo.createconomy.invalid`, name: p.name, country: p.country }));
writeFileSync(".demo-world-cache/p2/name-patches.json", JSON.stringify(rows, null, 1));
console.log(`patch-names: ${rows.length} members renamed (${[...new Set(rows.map((r) => r.country))].join(", ")}); avatar resets: ${renamedAvs.size}`);

/** activityLedger-only sweep retry: 3 users per call (heavy users' ledgers blow
 * the 4,096-read cap at 25). Tolerant per-call loop. */
import { readFileSync } from "node:fs";
import { convex } from "../lib/local-gate.mjs";
const runOnce = (fn, args) => {
  const res = convex(["run", fn, args]);
  const teardownBug = /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
  const out = (res.stdout ?? "").trim();
  const parsed = (() => { try { return JSON.parse(out.slice(out.indexOf("{"))); } catch { return null; } })();
  return { ok: (res.status === 0 || teardownBug) && parsed !== null, out, parsed };
};
const ids = JSON.parse(readFileSync(".demo-world-cache/remove-ids.json", "utf8"));
let del = 0, fails = 0;
for (let i = 0; i < ids.users.length; i += 3) {
  const args = JSON.stringify({ kind: "activityLedger", userIds: ids.users.slice(i, i + 3), postIds: [] });
  let r = runOnce("demoWorld/remove:sweepBatch", args);
  if (!r.ok) { // single-user fallback for a heavy trio
    for (const u of ids.users.slice(i, i + 3)) {
      const r2 = runOnce("demoWorld/remove:sweepBatch", JSON.stringify({ kind: "activityLedger", userIds: [u], postIds: [] }));
      if (r2.ok) del += r2.parsed.deleted ?? 0; else { fails++; console.log(`  user ${u} FAILED — ${r2.out.slice(0, 80)}`); }
    }
  } else del += r.parsed.deleted ?? 0;
  if ((i / 3) % 20 === 0) console.log(`  ledger @user ${i}: total ${del}`);
}
console.log(`sweep activityLedger: deleted ${del}${fails ? `, ${fails} FAILED` : ""}`);
const status = runOnce("demoWorld/remove:removalStatus");
console.log("removalStatus:", status.out);

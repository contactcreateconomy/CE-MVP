/** Drive remove:orphanSweep over the extension tables until drained. */
import { convex } from "../lib/local-gate.mjs";
const runOnce = (fn, args) => {
  const res = convex(["run", fn, JSON.stringify(args)]);
  const teardownBug = /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
  const out = (res.stdout ?? "").trim();
  const parsed = (() => { try { return JSON.parse(out.slice(out.indexOf("{"))); } catch { return null; } })();
  return { ok: (res.status === 0 || teardownBug) && parsed !== null, out, parsed };
};
for (const table of ["postSeoMeta", "postRevisions", "postReviews", "postCompares", "postSparks", "postDebates", "postHelps", "postNews", "postShowcases"]) {
  let del = 0, cursor = null;
  for (;;) {
    const r = runOnce("demoWorld/remove:orphanSweep", cursor ? { table, cursor } : { table });
    if (!r.ok) { console.log(`${table} FAILED — ${r.out.slice(0, 90)}`); break; }
    del += r.parsed.deleted ?? 0;
    if (r.parsed.isDone) break;
    cursor = r.parsed.continueCursor;
  }
  console.log(`orphan ${table}: deleted ${del}`);
}

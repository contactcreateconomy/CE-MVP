/** Full-corpus world fingerprint, paged and STREAMED client-side. The one-shot
 * internalQuery exceeds the per-execution read cap at 16.6k anchors, and a
 * collect-all fold OOMs the driver — so each page is hashed immediately into
 * commutative lanes (XOR + sum of per-part FNV hashes, two seeds): no parts
 * are retained, no sort needed, order-independent. All comparisons (export,
 * remove, re-import) use this same function. Progress on stderr, one line/page. */
import { convex } from "../../lib/local-gate.mjs";

const fnv = (str, seed, prime) => {
  let h = seed >>> 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), prime) >>> 0;
  return h >>> 0;
};

export function worldFingerprint() {
  const call = (args) => {
    // tolerant gate (no echo — convexRun prints every page and the output flood kills the task)
    const res = convex(["run", "demoWorld/importChrome:fingerprintParts", JSON.stringify(args)]);
    const teardownBug = /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
    if (res.status !== 0 && !teardownBug) throw new Error("fingerprintParts call failed: " + String(res.stderr ?? res.stdout ?? "").slice(0, 120));
    const out = (res.stdout ?? "").trim();
    return JSON.parse(out.slice(out.indexOf("{")));
  };
  const state = { posts: 0, comments: 0, xor1: 0, sum1: 0, xor2: 0, sum2: 0, n: 0 };
  for (const scope of ["post", "comment"]) {
    let cursor = null;
    for (;;) {
      const page = call({ scope, cursor });
      process.stderr.write("page " + scope + " +" + page.parts.length + " done=" + page.isDone + "\n");
      for (const part of page.parts) {
        const h1 = fnv(part, 0x811c9dc5, 16777619);
        const h2 = fnv(part, 0x01000193, 2246822519);
        state.xor1 = (state.xor1 ^ h1) >>> 0;
        state.sum1 = (state.sum1 + h1) >>> 0;
        state.xor2 = (state.xor2 ^ h2) >>> 0;
        state.sum2 = (state.sum2 + h2) >>> 0;
        state.n++;
      }
      state[scope === "post" ? "posts" : "comments"] += page.parts.length;
      if (page.isDone) break;
      cursor = page.continueCursor;
    }
  }
  const hex = (x) => (x >>> 0).toString(16).padStart(8, "0");
  return {
    posts: state.posts,
    comments: state.comments,
    parts: state.n,
    fingerprint: hex(state.xor1) + hex(state.xor2) + hex(state.sum1) + hex(state.sum2),
    algorithm: "paged-commutative-fnv-v2",
  };
}

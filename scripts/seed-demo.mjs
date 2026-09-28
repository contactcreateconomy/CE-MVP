#!/usr/bin/env node
/**
 * seed:demo — deterministic demo content for local dev (R3).
 *
 * Gate: HARD-REFUSE unless the selected deployment is local:<name>/anonymous:<name>.
 * Idempotent: safe to re-run; skips whatever already exists.
 */
import { assertLocalDeployment, convexRun, step, ok } from "./lib/local-gate.mjs";

const deployment = assertLocalDeployment("seed:demo");
console.log(`seed:demo — targeting ${deployment} (local only)`);

step("seeding demo identities, posts, engagement, notifications…");
const out = convexRun("seed/demo:seed");
try {
  const parsed = JSON.parse(out);
  ok(`posts: ${JSON.stringify(parsed.posts)}`);
  ok(`engagement: ${JSON.stringify(parsed.engagement)}`);
  ok(`notifications: ${JSON.stringify(parsed.notifications)}`);
} catch {
  ok("seed function ran (raw output above)");
}
ok("run `pnpm seed:check` to print the data fingerprint");

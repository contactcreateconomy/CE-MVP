#!/usr/bin/env node
/**
 * reset:local — one command to a known-good local state (R3).
 *
 * 1. HARD-REFUSE unless the deployment selector is local:<name>/anonymous:<name>
 * 2. Wipe ALL table data via the officially supported CLI path:
 *    `convex import --replace-all` with an empty table file — the CLI
 *    documents this as "clearing tables that appear in the schema but not
 *    in the import file". Functions, schema, env vars, and storage are
 *    untouched (unlike deleting .convex state, which resets the whole
 *    deployment including backend env + auth keys).
 * 3. Re-run the idempotent config seeds (platform config, legal, rulebook,
 *    admin widgets).
 * 4. Recreate devtest@example.com (staff allow-list grants every role)
 *    via dev/ensureTestUser:ensure — password supplied via
 *    DEV_TEST_USER_PASSWORD env or --password flag, never hardcoded.
 * 5. seed:demo, then print the seed:check fingerprint.
 */
import { writeFileSync, rmSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";
import {
  assertLocalDeployment,
  convex,
  convexRun,
  convexEnvSet,
  convexEnvRemove,
  preflightDevGuard,
  step,
  ok,
} from "./lib/local-gate.mjs";

// ── PREFLIGHT a) — inputs, BEFORE anything destructive ─────────────────
// Password first: a reset without it silently skips the devtest account
// and the two machines' fingerprints diverge. Abort instead.
const argvPassword = (() => {
  const i = process.argv.indexOf("--password");
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();
const password = argvPassword || process.env.DEV_TEST_USER_PASSWORD || "";
if (password.length < 8) {
  console.error(
    "  [✗] reset:local: DEV_TEST_USER_PASSWORD missing or shorter than 8 chars.\n" +
      "      Re-run with: DEV_TEST_USER_PASSWORD=<password> pnpm reset:local\n" +
      "      (or --password <password>). Nothing was wiped — the check runs before\n" +
      "      the data reset so the account is never silently skipped.\n",
  );
  process.exit(1);
}

const deployment = assertLocalDeployment("reset:local");
console.log(`reset:local — targeting ${deployment}`);

// ── PREFLIGHT b) — server-side guard: prove the CLI sees the local backend
// (a leftover CONVEX_DEPLOY_KEY would retarget every child at a cloud
// deployment; children run sanitized and this proves the live target).
step("preflight: seed/devGuard:assertLocal (positive confirmation) …");
const confirmation = await preflightDevGuard("reset:local");
ok(`server-side guard confirmed local backend (${confirmation.url})`);

// ── 1. wipe data (official --replace-all import path) ─────────────────
step("wiping all table data (convex import --replace-all, empty table)…");
const emptyFile = path.join(tmpdir(), "cemvp-empty-table.jsonl");
writeFileSync(emptyFile, "");
const wipe = convex([
  "import", emptyFile,
  "--format", "jsonLines",
  "--table", "saves",
  "--replace-all",
  "--yes",
]);
rmSync(emptyFile, { force: true });
if (wipe.stdout) process.stdout.write(wipe.stdout);
if (wipe.stderr) process.stderr.write(wipe.stderr);
if (wipe.status !== 0) {
  console.error(`  [✗] data wipe failed (exit ${wipe.status}) — nothing else will run`);
  process.exit(1);
}
ok("all tables cleared (functions/schema/env untouched)");

// ── 2. config seeds ────────────────────────────────────────────────────
step("config seeds (idempotent)…");
convexRun("seed:bootstrap");
ok("seed:bootstrap — categories, eventCatalog, jobs (signup gate)");
convexRun("legalContent:seedDefaults");
ok("legalContent:seedDefaults — 4 legal docs");
convexRun("rulebook:deploySeed");
ok("rulebook:deploySeed — moderation rulebook");
convexRun("admin/widgetsCatalog:deploySeed");
ok("admin/widgetsCatalog:deploySeed — admin nav");

// ── 3. dev test account ────────────────────────────────────────────────
step("dev test account (devtest@example.com)…");
convexEnvSet("ALLOW_DEV_TEST_USER", "true");
convexEnvSet("DEV_TEST_USER_PASSWORD", password);
const out = convexRun("dev/ensureTestUser:ensure");
convexEnvRemove("DEV_TEST_USER_PASSWORD");
convexEnvRemove("ALLOW_DEV_TEST_USER");
const existed = out.includes("alreadyExisted\":true");
ok(existed ? "account already existed" : "account created — staff roles auto-granted (FOUNDER_EMAILS)");

// ── 4. demo seed ────────────────────────────────────────────────────────
step("demo seed…");
convexRun("seed/demo:seed");
ok("demo content seeded");

// ── 4b. demo world replay (DEFAULT since the 011 merge) ────────────────
// The full demo corpus (1,500 posts / 15,094 comments / 500 members) replays
// from .demo-world-cache/ so every machine lands in the same demo state.
// Opt out with --no-demo (base seed only). Requires the cache — check first.
const NO_DEMO = process.argv.includes("--no-demo");
if (NO_DEMO) {
  ok("demo world replay SKIPPED (--no-demo)");
} else if (!existsSync(".demo-world-cache/p3/posts.jsonl")) {
  ok("demo world replay SKIPPED (no .demo-world-cache corpus on this machine — base seed only)");
} else {
  step("demo world replay (sweep orphan storage + p6-import + settle)… this takes ~1.5-2 hours");
  // the wipe left previous replays' storage rows orphaned (registry gone) and
  // the upload markers would make the import skip uploads — clean both first
  for (;;) {
    const swept = convex(["run", "demoWorld/remove:sweepOrphanStorage", "{}"]);
    const out = (swept.stdout ?? "").trim();
    const m = out && out.indexOf("{") >= 0 ? JSON.parse(out.slice(out.indexOf("{"))) : null;
    if (!swept || !m || !m.remaining) break;
  }
  ok("orphan storage swept");
  rmSync(".demo-world-cache/p5/upload-done.jsonl", { force: true });
  const imp = spawnSync(process.execPath, ["scripts/demo-world/p6-import.mjs"], {
    stdio: "inherit", shell: false,
  });
  if (imp.status !== 0) { console.error("  [✗] demo world import failed"); process.exit(1); }
  ok("demo world imported");
  const settle = spawnSync(process.execPath, ["scripts/demo-world/p6-settle.mjs"], { stdio: "inherit", shell: false });
  if (settle.status !== 0) { console.error("  [✗] demo settle failed"); process.exit(1); }
  ok("demo settle drained (12 projection jobs)");
}

// ── 5. fingerprint ──────────────────────────────────────────────────────
step("fingerprint…");
const check = spawnSync(process.execPath, ["scripts/seed-check.mjs"], {
  stdio: "inherit",
  shell: false,
});
if (check.status !== 0) {
  console.error("  [✗] seed:check failed");
  process.exit(1);
}
ok("reset:local complete — feed/profile/leaderboard/notifications are demo-populated");

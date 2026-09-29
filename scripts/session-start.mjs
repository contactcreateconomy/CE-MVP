#!/usr/bin/env node
/**
 * session:start — daily ritual, first command of every work session, on
 * any branch, macOS or Windows (three-machine, two-person workflow —
 * see ak-redesign/TEAM-WORKFLOW.md).
 *
 *   1. fetch + pull the current branch (fast-forward only — divergence
 *      FAILS, nothing is ever auto-merged)
 *   2. say whether 011-Akilesh-Redesign has moved ahead of this branch
 *   3. pnpm install ONLY when the pull changed the lockfile
 *   4. data parity: reset:local when seed/schema files changed since this
 *      machine's last session, otherwise seed:check against
 *      scripts/seed-fingerprint.txt
 *   5. print the latest session-log entry of EVERY machine
 */
import path from "node:path";
import process from "node:process";
import {
  ROOT,
  git,
  gitText,
  runPnpm,
  runNodeScript,
  machineName,
  allMachinesLatest,
  latestEntry,
  SESSION_LOG_DIR,
} from "./lib/session.mjs";

const INTEGRATION_BRANCH = "011-Akilesh-Redesign";
const SEED_CHANGE_PATTERN = /(^|\/)(convex\/schema\.ts|convex\/seed\/|convex\/dev\/(demoSeed|ensureTestUser)|scripts\/(seed-|reset-local|seed-fingerprint))/;

const die = (msg) => {
  console.error(`\n  [✗] session:start: ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`  [✓] ${msg}`);
const say = (msg) => console.log(msg);

say(`\nsession:start — ${machineName()} — ${new Date().toISOString().replace("T", " ").slice(0, 16)} UTC\n`);

// ── 1. fetch + pull (fast-forward only; divergence fails) ──────────────
const branch = gitText(["rev-parse", "--abbrev-ref", "HEAD"]);
gitText(["fetch", "origin", branch, INTEGRATION_BRANCH]);

const upstream = git(["rev-parse", "--abbrev-ref", `HEAD@{upstream}`]).status === 0
  ? gitText(["rev-parse", "--abbrev-ref", "HEAD@{upstream}"])
  : null;

let pulled = [];
const lockfile = path.join(ROOT, "pnpm-lock.yaml");
const lockBefore = gitText(["hash-object", lockfile]);

if (!upstream) {
  say(`  [!] branch ${branch} has no upstream — skipping pull. Push with: git push -u origin ${branch}`);
} else {
  const local = gitText(["rev-parse", "HEAD"]);
  const remote = gitText(["rev-parse", "@{upstream}"]);
  const base = gitText(["merge-base", "HEAD", "@{upstream}"]);
  if (local !== remote && local !== base && remote !== base) {
    die(
      `branch ${branch} has DIVERGED from ${upstream} (local and remote both moved).\n` +
      `      Never auto-merged here. Reconcile manually, e.g.:\n` +
      `        git pull --rebase   (or)   git merge origin/${branch}\n` +
      `      then re-run pnpm session:start.`,
    );
  }
  if (remote !== base && local === base) {
    const out = git(["pull", "--ff-only"]);
    if (out.status !== 0) {
      die(`git pull --ff-only failed:\n${out.stderr?.trim().slice(0, 400)}`);
    }
    pulled = gitText(["log", "--oneline", `${local}..HEAD`]).split("\n").filter(Boolean);
    ok(`pulled ${pulled.length} commit(s) from ${upstream} (fast-forward only)`);
    for (const line of pulled.slice(0, 5)) say(`      ${line}`);
    if (pulled.length > 5) say(`      … +${pulled.length - 5} more`);
  } else if (local !== remote) {
    say(`  [!] this branch is ${gitText(["rev-list", "--count", `@{upstream}..HEAD`])} commit(s) AHEAD of ${upstream} — nothing to pull (session:end will push)`);
  } else {
    ok(`${branch} is up to date with ${upstream}`);
  }
}

// ── 2. has the integration branch moved ahead? ────────────────────────
if (branch !== INTEGRATION_BRANCH) {
  const ahead = gitText(["rev-list", "--count", `HEAD..origin/${INTEGRATION_BRANCH}`]);
  if (Number(ahead) > 0) {
    const last = gitText(["log", "-1", "--oneline", `origin/${INTEGRATION_BRANCH}`]);
    say(`  [!] ${INTEGRATION_BRANCH} has moved ${ahead} commit(s) ahead of ${branch} (last: ${last})\n      — rebase/merge when you're ready; nothing is merged automatically.`);
  } else {
    ok(`${branch} contains everything on origin/${INTEGRATION_BRANCH}`);
  }
}

// ── 3. install only when the lockfile changed ──────────────────────────
const lockAfter = gitText(["hash-object", lockfile]);
if (lockBefore !== lockAfter) {
  say("\n→ pnpm-lock.yaml changed — pnpm install …");
  const res = runPnpm(["install"]);
  if (res.status !== 0) die("pnpm install failed");
  ok("dependencies installed");
} else {
  ok("lockfile unchanged — skipping pnpm install");
}

// ── 4. data parity ──────────────────────────────────────────────────────
// this machine's OWN last session head (parsed from its session log)
const myLog = path.join(SESSION_LOG_DIR, `${machineName()}.md`);
const entry = latestEntry(myLog);
const ownLastHead = entry?.match(/@ ([0-9a-f]{7,40})/)?.[1] ?? null;

if (!ownLastHead) {
  say("\n→ no previous session on this machine — running seed:check (run reset:local yourself if it reports stale data)");
  const res = runNodeScript("seed-check.mjs");
  if (res.status !== 0) {
    say("  [!] seed:check did not pass — likely a fresh machine or changed seeds.");
    say("      Fix with: DEV_TEST_USER_PASSWORD='<pw>' pnpm reset:local");
    process.exit(res.status ?? 1);
  }
} else {
  const hashOk = git(["cat-file", "-e", `${ownLastHead}^{commit}`]).status === 0;
  if (!hashOk) {
    say(`\n→ last-session commit ${ownLastHead.slice(0, 8)} not in this clone (history rewritten?) — seed:check`);
    const res = runNodeScript("seed-check.mjs");
    process.exit(res.status === 0 ? 0 : res.status ?? 1);
  }
  const changed = gitText(["diff", "--name-only", `${ownLastHead}..HEAD`]).split("\n").filter(Boolean);
  const seedChanged = changed.filter((f) => SEED_CHANGE_PATTERN.test(f));
  if (seedChanged.length > 0) {
    say(`\n→ seed/schema changed since this machine's last session (${seedChanged.length} file(s)):`);
    for (const f of seedChanged.slice(0, 8)) say(`      ${f}`);
    const pw = process.env.DEV_TEST_USER_PASSWORD;
    say("\n→ running reset:local (needs DEV_TEST_USER_PASSWORD) …");
    if (!pw) {
      die(
        "reset:local requires the dev password.\n" +
        "      Re-run: DEV_TEST_USER_PASSWORD='<pw>' pnpm session:start",
      );
    }
    const res = runNodeScript("reset-local.mjs", ["--password", pw]);
    if (res.status !== 0) die("reset:local failed");
  } else {
    say("\n→ no seed/schema changes since last session — seed:check against scripts/seed-fingerprint.txt …");
    const res = runNodeScript("seed-check.mjs");
    if (res.status !== 0) {
      die(
        "seed:check failed (stale data or changed seeds).\n" +
        "      Refresh: DEV_TEST_USER_PASSWORD='<pw>' pnpm reset:local\n" +
        "      If seeds changed on purpose, scripts/seed-fingerprint.txt must be updated in the\n" +
        "      same commit as the seed change (TEAM-WORKFLOW.md).",
      );
    }
  }
}

// ── 5. every machine's latest session entry ────────────────────────────
say("\n─ latest session per machine " + "─".repeat(20));
const machines = allMachinesLatest();
if (machines.length === 0) {
  say("  (no session logs yet — ak-redesign/00-control/session-log/)");
} else {
  for (const { machine, entry } of machines) {
    say(`\n  ▪ ${machine}\n${entry.split("\n").map((l) => `    ${l}`).join("\n")}`);
  }
}
say("\nsession:start complete — good to work. End with: pnpm session:end");

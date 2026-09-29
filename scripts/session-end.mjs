#!/usr/bin/env node
/**
 * session:end — daily ritual, last command of every work session.
 *
 *   1. REFUSE (exit 1, listing what) when the working tree is uncommitted,
 *      the branch has unpushed commits, or there is no upstream — the repo
 *      is always left shareable
 *   2. append today's entry to ak-redesign/00-control/session-log/<machine>.md
 *      (one file PER MACHINE: no cross-machine merge conflicts)
 *   3. commit the log entry and push
 *
 * The "stopped at:" note is prompted for interactively when possible;
 * agents pass --note "..." instead.
 */
import { createInterface } from "node:readline/promises";
import process from "node:process";
import { git, gitText, machineName, appendEntry } from "./lib/session.mjs";

const die = (msg) => {
  console.error(`\n  [✗] session:end: ${msg}`);
  process.exit(1);
};
const ok = (msg) => console.log(`  [✓] ${msg}`);
const say = (msg) => console.log(msg);

const noteArg = (() => {
  const i = process.argv.indexOf("--note");
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : null;
})();

say(`\nsession:end — ${machineName()}\n`);

// ── 1. shareable-state checks ──────────────────────────────────────────
const dirty = git(["status", "--porcelain"]);
const files = (dirty.stdout ?? "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
if (files.length > 0) {
  die(
    "working tree is not clean — commit or stash first:\n" +
    files.map((f) => `      ${f}`).join("\n"),
  );
}
ok("working tree clean");

const upstream = git(["rev-parse", "--abbrev-ref", "HEAD@{upstream}"]);
if (upstream.status !== 0) {
  die("this branch has no upstream — push it first: git push -u origin <branch>");
}
const branch = gitText(["rev-parse", "--abbrev-ref", "HEAD"]);
const upstreamName = gitText(["rev-parse", "--abbrev-ref", "HEAD@{upstream}"]);
ok(`branch ${branch} tracks ${upstreamName}`);

const unpushed = gitText(["rev-list", `@{upstream}..HEAD`]).split("\n").filter(Boolean);
if (unpushed.length > 0) {
  die(
    `${unpushed.length} unpushed commit(s) — push before ending the session:\n` +
    unpushed.map((h) => `      ${gitText(["log", "-1", "--oneline", h])}`).join("\n"),
  );
}
ok("everything is pushed");

// ── 2. the "stopped at" note ────────────────────────────────────────────
let note = noteArg;
if (!note) {
  if (process.stdin.isTTY) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    note = await rl.question('stopped at: (one line — where does the next session pick up?) ');
    rl.close();
  }
}
if (!note || !note.trim()) {
  die(
    'no "stopped at" note given — the session log entry needs one.\n' +
    "      Re-run interactively, or: pnpm session:end --note \"<where the next session picks up>\"",
  );
}
note = note.trim().replace(/\s+/g, " ").slice(0, 300);

// ── 3. append + commit + push the log ──────────────────────────────────
const head = gitText(["rev-parse", "HEAD"]);
const person = gitText(["config", "user.name"]) || "unknown";
const file = appendEntry({ person, branch, head, note });
say(`\n  → logged to ${file.replace(/\\/g, "/").split("/").slice(-3).join("/")}:`);
say(`      ## ${person} — ${branch} @ ${head.slice(0, 10)}\n      stopped at: ${note}`);

const addFile = git(["add", file.replace(/\\/g, "/")]);
if (addFile.status !== 0) die(`git add failed: ${addFile.stderr}`);
const commit = git(["commit", "-m", `session log: ${machineName()} — ${branch} @ ${head.slice(0, 8)}`]);
if (commit.status !== 0) die(`git commit failed: ${commit.stderr}`);
ok("log entry committed");

const push = git(["push"]);
if (push.status !== 0) {
  die(
    `git push failed — the log commit exists locally:\n${push.stderr?.slice(0, 300)}\n` +
    "      Re-run push manually; the session log entry is already written.",
  );
}
ok("pushed");
say("\nsession:end complete — clean handoff.");

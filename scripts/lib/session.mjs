/**
 * Shared helpers for session:start / session:end (three-machine workflow).
 * Cross-platform: node APIs + git only; the pnpm runner carries the Windows
 * fallback from scripts/local-setup.mjs (npm installs ship no pnpm.exe, and
 * child_process cannot spawn sh/.cmd shims with shell:false).
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { realpathSync } from "node:fs";
import { createRequire } from "node:module";
import { hostname } from "node:os";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "..", "..",
);
export const SESSION_LOG_DIR = path.join(ROOT, "ak-redesign", "00-control", "session-log");

/** Stable per-machine name for the session log file (one file PER MACHINE,
 *  so parallel sessions never conflict). */
export function machineName() {
  return hostname().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown-machine";
}

/** git helper — returns { status, stdout, stderr }. */
export function git(args, opts = {}) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8", shell: false, ...opts });
}

export function gitText(args) {
  const res = git(args);
  if (res.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${res.stderr?.trim() || res.status}`);
  }
  return (res.stdout ?? "").trim();
}

/** pnpm runner with the local-setup fallback: plain `pnpm` where it is
 *  spawnable (macOS/Linux, or a pnpm.exe install), else the global pnpm.cjs
 *  (npm-prefix install first, then next to the current node binary). */
export function runPnpm(args) {
  const tryPlain = spawnSync("pnpm", ["--version"], { encoding: "utf8", shell: false });
  if (tryPlain.status === 0) {
    return spawnSync("pnpm", args, { cwd: ROOT, encoding: "utf8", stdio: "inherit", shell: false });
  }
  const candidates = [];
  if (process.env.APPDATA) {
    candidates.push(path.join(process.env.APPDATA, "npm", "node_modules", "pnpm", "bin", "pnpm.cjs"));
  }
  candidates.push(path.join(path.dirname(process.execPath), "node_modules", "pnpm", "bin", "pnpm.cjs"));
  const cjs = candidates.find((c) => existsSync(c));
  if (!cjs) {
    throw new Error("pnpm not spawnable and no global pnpm.cjs found (npm prefix or next to node) — see scripts/local-setup.mjs prerequisites");
  }
  return spawnSync(process.execPath, [cjs, ...args], { cwd: ROOT, encoding: "utf8", stdio: "inherit", shell: false });
}

/** Run a repo script (scripts/*.mjs) with the current node — never via
 *  pnpm, so the runner itself never needs pnpm on PATH. */
export function runNodeScript(name, args = []) {
  return spawnSync(process.execPath, [path.join(ROOT, "scripts", name), ...args], {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
  });
}

/** Latest session-log entry of one machine file: everything after the
 *  last "## " heading. Returns null when the machine has no log yet. */
export function latestEntry(file) {
  if (!existsSync(file)) return null;
  const text = readFileSync(file, "utf8");
  const parts = text.split(/^## /m);
  if (parts.length < 2) return text.trim() || null;
  return `## ${parts[parts.length - 1].trim()}`;
}

/** Every machine's latest entry, keyed by file name. */
export function allMachinesLatest() {
  if (!existsSync(SESSION_LOG_DIR)) return [];
  return readdirSync(SESSION_LOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => ({ machine: f.replace(/\.md$/, ""), entry: latestEntry(path.join(SESSION_LOG_DIR, f)) }))
    .filter(({ entry }) => entry !== null);
}

/** Append a new dated entry to this machine's log (creates the file). */
export function appendEntry({ person, branch, head, note }) {
  mkdirSync(SESSION_LOG_DIR, { recursive: true });
  const file = path.join(SESSION_LOG_DIR, `${machineName()}.md`);
  const stamp = new Date().toISOString().replace("T", " ").replace("Z", " UTC");
  const existing = existsSync(file) ? readFileSync(file, "utf8") : `# Session log — ${machineName()}\n\nOne file per machine (no cross-machine merge conflicts). Latest entry at the bottom.\n\n`;
  const updated =
    existing.trimEnd() +
    `\n\n## ${stamp} — ${person} — ${branch} @ ${head}\nstopped at: ${note}\n`;
  writeFileSync(file, updated);
  return file;
}

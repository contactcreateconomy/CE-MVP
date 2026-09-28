/**
 * Shared helpers for the local dev seed/reset scripts (R3 + review fix).
 *
 * Defense layers, in order:
 *   1. selector gate — CONVEX_DEPLOYMENT must be exactly anonymous:anonymous-<name>
 *      or local:local-<name> (the CLI treats only anonymous-…/local-… names as
 *      the local backend; any other name resolves inside a cloud project).
 *   2. sanitized child env — CONVEX_DEPLOY_KEY (which the CLI applies FIRST,
 *      ignoring the selector) and the self-hosted/CONVEX_URL overrides are
 *      removed from every spawned convex child, with a warning naming them.
 *   3. server-side allowlist — seed/devGuard:assertLocal (loopback
 *      CONVEX_CLOUD_URL only) runs as a preflight before destructive steps
 *      and again inside every seed mutation.
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
export const ROOT = path.resolve(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")),
  "..", "..",
);
export const CONVEX_BIN = path.join(
  path.dirname(realpathSync(require.resolve("convex/package.json"))),
  "bin", "main.js",
);

/** Env overrides that retarget the CLI at a non-local deployment. The CLI
 *  applies CONVEX_DEPLOY_KEY before any selector, so a leftover key in the
 *  parent shell would silently change the target of every command below. */
const SANITIZED_VARS = [
  "CONVEX_DEPLOY_KEY",
  "CONVEX_SELF_HOSTED_URL",
  "CONVEX_SELF_HOSTED_ADMIN_KEY",
  "CONVEX_URL",
];

/** Copy of process.env with retargeting overrides removed (and named).
 *  Memoized: the warning prints once per process, not per spawned child. */
let cachedEnv = null;
export function sanitizedEnv() {
  if (cachedEnv) return cachedEnv;
  const env = { ...process.env };
  const removed = SANITIZED_VARS.filter((name) => {
    const value = env[name];
    if (value !== undefined && value !== "") {
      delete env[name];
      return true;
    }
    return false;
  });
  if (removed.length > 0) {
    console.warn(
      `\n  [!] WARNING: removed from child env (these would retarget the CLI at a\n` +
        `      cloud deployment regardless of the selector): ${removed.join(", ")}\n`,
    );
  }
  cachedEnv = env;
  return env;
}

/** Read CONVEX_DEPLOYMENT from the process env, falling back to the root
 *  .env.local the CLI would load. NOTE: this is NOT the CLI's full
 *  precedence — a CONVEX_DEPLOY_KEY would win over it — which is exactly
 *  why the child env is sanitized before any spawn. */
export function selectedDeployment() {
  const envFile = path.join(ROOT, ".env.local");
  let fromFile = "";
  if (existsSync(envFile)) {
    const line = readFileSync(envFile, "utf8")
      .split(/\r?\n/)
      .find((l) => l.startsWith("CONVEX_DEPLOYMENT="));
    if (line) fromFile = line.slice("CONVEX_DEPLOYMENT=".length).trim();
  }
  return process.env.CONVEX_DEPLOYMENT || fromFile;
}

/** R3 hard gate: only the CLI's true local-backend names pass. Anything
 *  else — including anonymous:<cloud-name> — resolves inside a cloud
 *  project and is refused. */
export function assertLocalDeployment(label) {
  const deployment = selectedDeployment();
  if (!/^(anonymous:anonymous-|local:local-)/.test(deployment)) {
    console.error(
      `\n  [✗] ${label}: refusing to run.\n` +
        `      CONVEX_DEPLOYMENT is ${deployment || "not set"} — expected anonymous:anonymous-* or local:local-*\n` +
        `      (the CLI treats only those names as the local backend; anything else\n` +
        `       targets a cloud project). The selector is written by the CLI on\n` +
        `       first \`pnpm backend\`. Production is founder-only.\n`,
    );
    process.exit(1);
  }
  return deployment;
}

/** Run a convex CLI command through node with a sanitized env. */
export function convex(args, opts = {}) {
  const res = spawnSync(process.execPath, [CONVEX_BIN, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: sanitizedEnv(),
    shell: false,
    ...opts,
  });
  return res;
}

/** convex run with the Windows teardown bug tolerated + output printed. */
export function convexRun(fn, args = "{}") {
  const res = convex(["run", fn, args]);
  if (res.stdout) process.stdout.write(res.stdout);
  if (res.stderr) process.stderr.write(res.stderr);
  const teardownBug =
    /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
  if (res.status !== 0 && !teardownBug) {
    console.error(`  [✗] convex run ${fn} failed (exit ${res.status})`);
    process.exit(1);
  }
  return (res.stdout ?? "").trim();
}

/** Preflight: prove the CLI is talking to the local backend before any
 *  destructive step. Runs seed/devGuard:assertLocal — throws on cloud.
 *
 *  Exit-code note: on Windows/Node 24 the convex CLI child often dies in
 *  libuv teardown (UV_HANDLE_CLOSING / 0xC0000409) AFTER the function
 *  result, sometimes eating the small "null" stdout. The decision is
 *  therefore refusal-text-driven: any guard error text aborts; a bare
 *  teardown crash with no error text counts as pass. */
export function preflightDevGuard(label) {
  const res = convex(["run", "seed/devGuard:assertLocal"]);
  const output = `${res.stdout ?? ""}${res.stderr ?? ""}`;
  if (res.stdout) process.stdout.write(res.stdout);
  const refused = /dev guard: refusing|Uncaught Error|Server Error|Request ID/i.test(output);
  if (refused) {
    if (res.stderr) process.stderr.write(res.stderr);
    console.error(`\n  [✗] ${label}: preflight seed/devGuard:assertLocal REFUSED — not the local backend:\n${output.slice(0, 400)}\n`);
    process.exit(1);
  }
  const teardownCrash =
    res.status !== 0 &&
    (/UV_HANDLE_CLOSING|Assertion failed/i.test(res.stderr ?? "") ||
      res.status === 3221226505);
  if (res.status !== 0 && !teardownCrash) {
    if (res.stderr) process.stderr.write(res.stderr);
    console.error(`\n  [✗] ${label}: preflight seed/devGuard:assertLocal failed (exit ${res.status}):\n${output.slice(0, 400)}\n`);
    process.exit(1);
  }
}

export function convexEnvSet(name, value) {
  const res = convex(["env", "set", name, "--", value]);
  if (res.status !== 0) {
    console.error(`  [✗] convex env set ${name} failed (exit ${res.status})`);
    process.exit(1);
  }
}

export function convexEnvRemove(name) {
  const res = convex(["env", "remove", name]);
  if (res.status !== 0) {
    console.error(`  [!] convex env remove ${name} exited ${res.status} (may already be unset)`);
  }
}

export function step(msg) {
  console.log(`\n→ ${msg}`);
}
export function ok(msg) {
  console.log(`  [✓] ${msg}`);
}

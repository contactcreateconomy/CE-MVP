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
import { spawn, spawnSync } from "node:child_process";
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

/** R3 hard gate: FULL-STRING match — only the CLI's true local-backend
 *  names pass. The CLI keeps only the LAST colon segment of a selector,
 *  so `anonymous:anonymous-x:<cloud>` resolves in a cloud project; a
 *  prefix match would wave it through. No extra colons/segments allowed. */
export function assertLocalDeployment(label) {
  const deployment = selectedDeployment();
  if (!/^(anonymous:anonymous-[a-z0-9-]+|local:local-[a-z0-9_-]+)$/.test(deployment)) {
    console.error(
      `\n  [✗] ${label}: refusing to run.\n` +
        `      CONVEX_DEPLOYMENT is ${deployment || "not set"} — expected exactly\n` +
        `      anonymous:anonymous-<name> or local:local-<name> (full string, no extra segments).\n` +
        `      The CLI keeps only the last colon segment, so anything else targets a\n` +
        `      cloud project. The selector is written by the CLI on first \`pnpm backend\`.\n` +
        `      Production is founder-only.\n`,
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

/** Preflight: positive confirmation that the CLI is talking to the local
 *  backend, required before anything destructive. FAIL CLOSED — the script
 *  proceeds ONLY when ALL of this holds:
 *    1. the watch banner's resolved URL matches the loopback regex
 *       (independent CLI-side confirmation), and
 *    2. the guard query's stdout parses to exactly { ok, url }
 *       with ok === true and a loopback url (server-side confirmation).
 *  Anything else aborts: crash, teardown assertion, non-zero exit, empty
 *  or unparseable output. No exit-status tolerance applies here (the
 *  UV_HANDLE_CLOSING tolerance is only for seed steps AFTER preflight).
 *
 *  Why --watch: plain `convex run` on Windows/Node 24 dies in a libuv
 *  teardown abort that eats small stdout payloads entirely (0 of 6 runs
 *  produced any output). Watch mode keeps the process alive, so both the
 *  banner and the result are written before we kill the child. */
const LOOPBACK = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;

export async function preflightDevGuard(label) {
  const child = spawn(process.execPath, [CONVEX_BIN, "run", "seed/devGuard:assertLocal", "--watch"], {
    cwd: ROOT,
    stdio: ["ignore", "pipe", "pipe"],
    env: sanitizedEnv(),
    shell: false,
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (d) => { stdout += d; });
  child.stderr.on("data", (d) => { stderr += d; });

  const killChild = () => {
    child.kill();
    setTimeout(() => {
      if (child.exitCode === null && child.signalCode === null) {
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { shell: false });
      }
    }, 1500);
  };

  /** Extract the result object once stdout holds a complete one. */
  const extract = () => {
    const start = stdout.indexOf("{");
    const end = stdout.lastIndexOf("}");
    if (start < 0 || end <= start) return undefined;
    try {
      return JSON.parse(stdout.slice(start, end + 1));
    } catch {
      return undefined;
    }
  };

  const outcome = await new Promise((resolve) => {
    const deadline = setTimeout(() => resolve("timeout"), 30_000);
    const poll = setInterval(() => {
      const parsed = extract();
      if (parsed && typeof parsed === "object" && "ok" in parsed) {
        clearInterval(poll);
        clearTimeout(deadline);
        resolve("result");
      } else if (/refusing|Failed to run function|Uncaught Error/.test(stderr)) {
        clearInterval(poll);
        clearTimeout(deadline);
        resolve("error");
      }
    }, 200);
  });
  killChild();

  const fail = (why) => {
    console.error(
      `\n  [✗] ${label}: preflight REFUSED — no positive confirmation (${why}).\n` +
        `      stdout: ${JSON.stringify(stdout.slice(0, 200))}\n` +
        `      stderr: ${JSON.stringify(stderr.slice(0, 200))}\n` +
        `      Fail-closed: nothing runs without the guard's explicit { ok: true, url }.\n`,
    );
    process.exit(1);
  };

  if (outcome === "error") fail("guard errored or refused (non-loopback deployment)");
  if (outcome === "timeout") fail("watch produced no result within 30s");

  // Best-effort CLI-side confirmation: the "Watching query … on <url>" banner
  // is not guaranteed in stdout (depends on CLI codegen/push state), but IF
  // it appears anywhere it must name a loopback URL.
  const bannerMatch = `${stdout}${stderr}`.match(/on (https?:\/\/\S+?)(?:\.{3}|…|$)/);
  if (bannerMatch && !LOOPBACK.test(bannerMatch[1])) {
    fail(`CLI resolved a non-loopback URL: ${bannerMatch[1]}`);
  }

  const parsed = extract();
  if (
    !parsed ||
    Object.keys(parsed).sort().join(",") !== "ok,url" ||
    parsed.ok !== true ||
    typeof parsed.url !== "string" ||
    !LOOPBACK.test(parsed.url)
  ) {
    fail(`result was not exactly { ok: true, url: <loopback> }: ${JSON.stringify(parsed).slice(0, 120)}`);
  }
  return parsed;
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

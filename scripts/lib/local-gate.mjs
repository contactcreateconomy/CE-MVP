/**
 * Shared helpers for the local dev seed/reset scripts (R3).
 *
 * - hard-refuses anything but a local:/anonymous: deployment selector
 * - resolves the convex CLI the same way scripts/local-setup.mjs does
 *   (pnpm layout, no require.resolve-through-exports)
 * - tolerates the Windows libuv UV_HANDLE_CLOSING teardown assertion
 *   that poisons child exit codes AFTER a successful result
 */
import { spawnSync, execFileSync } from "node:child_process";
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

/** Read CONVEX_DEPLOYMENT the same way the convex CLI does (.env.local wins
 *  only if the process env doesn't already set it). */
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

/** R3 hard gate: only ever touch local:/anonymous: deployments. */
export function assertLocalDeployment(label) {
  const deployment = selectedDeployment();
  if (!/^(local|anonymous):/.test(deployment)) {
    console.error(
      `\n  [✗] ${label}: refusing to run.\n` +
        `      CONVEX_DEPLOYMENT is ${deployment || "not set"} — expected local:* or anonymous:*\n` +
        `      (root .env.local selects the deployment; the selector is written by\n` +
        `       the CLI on first \`pnpm backend\`). Production is founder-only.\n`,
    );
    process.exit(1);
  }
  return deployment;
}

/** Run a convex CLI command through node. Returns {status, stdout, stderr}. */
export function convex(args, opts = {}) {
  const res = spawnSync(process.execPath, [CONVEX_BIN, ...args], {
    cwd: ROOT,
    encoding: "utf8",
    env: process.env,
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

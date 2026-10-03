#!/usr/bin/env node
/**
 * local-setup — one-shot agent/human setup for local Convex development.
 *
 * Idempotent: safe to re-run. Skips whatever is already done.
 * Works on macOS, Linux, and Windows (no shell-specific syntax; env values
 * are passed via spawn argv, never through a shell, so PEM newlines survive).
 *
 * What it does:
 *   1. Verifies prerequisites (Node >= 24, pnpm, deps installed)
 *   2. Creates app .env.local files from .env.example if missing
 *   3. Configures the local Convex backend (first-run "start fresh" is
 *      automated via the CLI's non-interactive env selector)
 *   4. Pushes functions/schema and starts the backend (left running)
 *   5. Sets required backend env vars (generates JWT keys if absent)
 *   6. Runs the idempotent config seeders (platform config, legal, rulebook,
 *      admin widget catalog). Demo content is NOT seeded (optional).
 *   7. Prints the manual last-mile: start apps, sign up the dev account.
 *
 * Usage:  node scripts/local-setup.mjs
 * Stop condition: the script exits after seeding; keep `pnpm backend`
 * running in its own terminal while developing (the script tells you).
 */

import { spawn, spawnSync, execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { createRequire } from "node:module";
import { generateKeyPairSync } from "node:crypto";
import path from "node:path";
import process from "node:process";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "..");
// The convex package doesn't export ./bin via "exports" — resolve the real
// path on disk (pnpm layout included) without going through require.resolve.
import { realpathSync } from "node:fs";
const CONVEX_PKG_DIR = path.dirname(realpathSync(require.resolve("convex/package.json")));
const CONVEX_BIN = path.join(CONVEX_PKG_DIR, "bin", "main.js");
const BACKEND_URL = "http://127.0.0.1:3210";

const DEVTEST_EMAIL = "devtest@example.com";
const FOUNDER_EMAIL = "contact.createconomy@gmail.com";

let step = 0;
const ok = (msg) => console.log(`  [\u2713] ${msg}`);
const info = (msg) => console.log(`  [\u2192] ${msg}`);
const section = (msg) => console.log(`\n${++step}. ${msg}`);
const die = (msg) => {
  console.error(`\n  [\u2717] ${msg}`);
  process.exit(1);
};

function run(bin, args, opts = {}) {
  return execFileSync(bin, args, {
    cwd: ROOT,
    stdio: opts.capture ? ["ignore", "pipe", "pipe"] : "inherit",
    encoding: "utf8",
    env: process.env,
    shell: false, // Windows-safe: no cmd wrapper, args passed verbatim
    ...opts,
  });
}

function nodeArgs(args, opts) {
  return run(process.execPath, args, opts);
}

async function main() {
  console.log("CE-MVP local development setup (idempotent — safe to re-run)\n");

  // ── 1. Prerequisites ────────────────────────────────────────────────
  section("Prerequisites");
  const major = Number(process.versions.node.split(".")[0]);
  if (major < 22) die(`Node >= 22 required (found ${process.versions.node}). Install Node 24 LTS and re-run.`);
  ok(`Node ${process.versions.node}`);

  // `pnpm` may not be spawnable on Windows: npm installs only ship sh/.cmd
  // shims (no .exe), which child_process refuses to run without a shell.
  // Fall back to the global pnpm.cjs run through the current node binary —
  // either next to the node binary (node-managed install) or in the npm
  // global prefix (~/AppData/Roaming/npm on Windows).
  const pnpm = (() => {
    try {
      const v = run("pnpm", ["--version"], { capture: true }).trim();
      if (v) return { bin: "pnpm", args: [] };
    } catch {}
    const candidates = [];
    if (process.env.APPDATA) {
      candidates.push(path.join(process.env.APPDATA, "npm", "node_modules", "pnpm", "bin", "pnpm.cjs"));
    }
    candidates.push(path.join(path.dirname(process.execPath), "node_modules", "pnpm", "bin", "pnpm.cjs"));
    for (const cjs of candidates) {
      if (existsSync(cjs)) return { bin: process.execPath, args: [cjs] };
    }
    die("pnpm not found on PATH. Install with `npm i -g pnpm@10` and re-run.");
  })();
  ok(`pnpm ${run(pnpm.bin, [...pnpm.args, "--version"], { capture: true }).trim()}`);

  if (!existsSync(path.join(ROOT, "node_modules"))) {
    info("node_modules missing — running pnpm install (a few minutes)…");
    run(pnpm.bin, [...pnpm.args, "install"]);
  }
  ok("dependencies installed");

  // ── 2. App env files ────────────────────────────────────────────────
  section("App environment files (.env.local)");
  for (const app of ["apps/forum", "apps/admin"]) {
    const local = path.join(ROOT, app, ".env.local");
    const example = path.join(ROOT, app, ".env.example");
    if (existsSync(local)) {
      ok(`${app}/.env.local already exists`);
    } else {
      if (!existsSync(example)) die(`${app}/.env.example missing from the repo`);
      copyFileSync(example, local);
      ok(`created ${app}/.env.local from .env.example`);
    }
  }

  // ── 3. Deployment selector ──────────────────────────────────────────
  section("Deployment selector (root .env.local)");
  const rootEnv = path.join(ROOT, ".env.local");
  let envText = existsSync(rootEnv) ? readFileSync(rootEnv, "utf8") : "";
  if (/^CONVEX_DEPLOYMENT=/m.test(envText)) {
    ok("already configured (leave the selector to the CLI — never hand-edit)");
  } else {
    // No selector: on the first `convex dev` the CLI auto-provisions an
    // ANONYMOUS local deployment (no Convex account, no login — the
    // `local:<name>` form requires a CLI-registered deployment and would
    // push the run into the cloud login flow) and writes the selector
    // itself. Writing nothing here is what keeps that flow non-interactive.
    ok("no selector present — the CLI will auto-provision an anonymous local deployment on first run");
  }

  // ── 4. Start backend (its watcher pushes functions/schema) ─────────
  section("Local backend (pushes functions/schema; stays running)");
  let backendUp = false;
  try {
    const res = await fetch(BACKEND_URL, { signal: AbortSignal.timeout(1500) });
    backendUp = res.ok;
  } catch {
    backendUp = false;
  }

  if (backendUp) {
    ok(`backend already running at ${BACKEND_URL} (owned by an existing \`convex dev\` watcher)`);
  } else {
    info("backend not running — launching `pnpm backend` in a detached process…");
    // CONVEX_AGENT_MODE=anonymous is the CLI's documented non-interactive path:
    // it skips the "Would you like to login?" prompt and auto-provisions an
    // anonymous local deployment (no Convex account needed).
    const child = spawn(process.execPath, [CONVEX_BIN, "dev"], {
      cwd: ROOT,
      detached: true,
      stdio: "ignore",
      env: { ...process.env, CONVEX_AGENT_MODE: "anonymous" },
    });
    child.unref();
    info(`launched (pid ${child.pid}). Waiting for ${BACKEND_URL}…`);
    let up = false;
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(BACKEND_URL, { signal: AbortSignal.timeout(1500) });
        if (res.ok) { up = true; break; }
      } catch {}
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (!up) {
      die(`backend did not come up on ${BACKEND_URL} within 2 minutes.\n` +
          "Run `pnpm backend` manually in a terminal; if it prompts to configure,\n" +
          "answer Y and choose \"start fresh\", then re-run this script.");
    }
    info("backend is up; its watcher pushes functions/schema automatically");
  }

  // ── 5. Backend env vars ─────────────────────────────────────────────
  section("Backend environment variables");
  const envGet = (name) => {
    try {
      const out = nodeArgs([CONVEX_BIN, "env", "get", name], { capture: true });
      return out.trim();
    } catch {
      return "";
    }
  };
  const envSet = (name, value) => {
    // shell:false + execFile argv → newlines/special chars pass through safely
    nodeArgs([CONVEX_BIN, "env", "set", name, "--", value]);
    ok(`set ${name}`);
  };

  if (envGet("SITE_URL")) ok("SITE_URL already set");
  else envSet("SITE_URL", "http://localhost:3000");

  if (envGet("AUTH_REDIRECT_ORIGINS")) ok("AUTH_REDIRECT_ORIGINS already set");
  else envSet("AUTH_REDIRECT_ORIGINS", "http://localhost:3000,http://localhost:3001");

  if (envGet("FOUNDER_EMAILS")) ok("FOUNDER_EMAILS already set");
  else envSet("FOUNDER_EMAILS", `${FOUNDER_EMAIL},${DEVTEST_EMAIL}`);

  if (envGet("JWT_PRIVATE_KEY") && envGet("JWKS")) {
    ok("JWT_PRIVATE_KEY / JWKS already set");
  } else {
    info("generating RS256 keypair for local auth…");
    const { publicKey, privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
    // Node's native JWK export — jose's exportJWK returns {} for KeyObjects
    // on some Node builds, which silently strips n/e and breaks verification.
    const jwk = publicKey.export({ format: "jwk" });
    jwk.use = "sig";
    jwk.alg = "RS256";
    jwk.kid = "local-dev-1";
    const pem = privateKey.export({ type: "pkcs8", format: "pem" }).toString();
    envSet("JWT_PRIVATE_KEY", pem); // one value, newlines intact — no --from-file
    envSet("JWKS", JSON.stringify({ keys: [jwk] }));
    ok("auth keys installed (local-only, disposable)");
  }

  // ── 6. Config seeders (idempotent) ──────────────────────────────────
  section("Config seeds (idempotent; no demo content)");
  const seedFns = [
    ["seed:bootstrap", "platform config — categories, eventCatalog, jobs (REQUIRED for signup)"],
    ["legalContent:seedDefaults", "4 legal docs"],
    ["rulebook:deploySeed", "moderation rulebook"],
    ["admin/widgetsCatalog:deploySeed", "admin console nav catalog"],
  ];
  for (const [fn, what] of seedFns) {
    info(`${fn} — ${what}…`);
    // Windows + Node 24: the CLI child can hit a libuv teardown assertion
    // (UV_HANDLE_CLOSING) AFTER it already printed a successful result —
    // the mutation ran fine, only the exit code is poisoned. Treat that
    // one case as success; anything else with a nonzero exit is real.
    const res = spawnSync(process.execPath, [CONVEX_BIN, "run", fn, "{}"], {
      cwd: ROOT,
      encoding: "utf8",
      env: process.env,
      shell: false,
    });
    if (res.stdout) process.stdout.write(res.stdout);
    if (res.stderr) process.stderr.write(res.stderr);
    const teardownBug =
      /UV_HANDLE_CLOSING/.test(res.stderr ?? "") && (res.stdout ?? "").trim().length > 0;
    if (res.status !== 0 && !teardownBug) {
      die(`seed ${fn} failed (exit ${res.status})`);
    }
    ok(`${fn} done`);
  }

  // ── 7. Done — manual last mile ──────────────────────────────────────
  section("Setup complete — last mile (manual, 1 minute)");
  console.log(`
  Keep the backend running (${BACKEND_URL}). If this script launched it in
  the background, prefer running it visibly yourself:

      pnpm backend          # terminal 1 — keep open

  Then start the apps:

      pnpm dev              # terminal 2 — forum  http://localhost:3000
      pnpm dev:admin        # terminal 3 — admin  http://localhost:3001

  Create the shared dev account (once, on the forum):
      Login -> Sign up
      Email:    ${DEVTEST_EMAIL}
      Password: <the team password agreed in team chat — never commit it>
      The email is staff allow-listed -> every role auto-granted (forum + admin).

  Founders keep using their own Google identity on production; do NOT create
  local password accounts for ${FOUNDER_EMAIL}.
`);
}

main().catch((err) => {
  die(err?.stack ?? String(err));
});

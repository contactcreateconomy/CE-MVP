#!/usr/bin/env node
/**
 * sync-components.mjs — copy compiled component files from node_modules into
 * tests/integration/components/ so convex-test's registerComponent can glob
 * them relatively (import.meta.glob cannot resolve bare-specifier globs
 * through a package's exports map).
 *
 * Run before the integration suite: pnpm pretest:convex (wired in
 * package.json). Re-run automatically whenever node_modules changes because
 * the pretest hook runs on every `pnpm test:convex`.
 */
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const target = join(repoRoot, "tests/integration/components");

const COMPONENTS = [
  {
    name: "rate-limiter",
    pkg: "@convex-dev/rate-limiter",
  },
];

for (const c of COMPONENTS) {
  // The exports map doesn't expose dist/component/schema.js directly —
  // resolve the published convex.config entry (its types point into
  // dist/component/) and derive the component root from it.
  const cfgUrl = require.resolve(`${c.pkg}/convex.config`);
  const src = dirname(cfgUrl); // .../dist/component
  if (!existsSync(src)) {
    console.error(`sync-components: ${c.name} source not found at ${src}`);
    process.exit(1);
  }
  const dest = join(target, c.name, "component");
  rmSync(join(target, c.name), { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  // Compiled component: *.js at the root + the _generated/ dir.
  cpSync(src, dest, {
    recursive: true,
    filter: (s) => !s.endsWith(".d.ts") && !s.endsWith(".map"),
  });
  // Some components import files from their PARENT dir (rate-limiter's
  // component/lib.js does "../shared.js") — copy those into the component's
  // parent folder inside the destination so "../x.js" still resolves.
  const compParent = dirname(src); // .../dist
  const parentShared = readdirSync(compParent).filter(
    (f) => f.endsWith(".js") && !f.endsWith(".map"),
  );
  for (const f of parentShared) {
    // Only copy files NOT already in the component dir (avoid shadowing).
    if (!existsSync(join(src, f))) {
      cpSync(join(compParent, f), join(target, c.name, f));
    }
  }
  console.log(`sync-components: ${c.name} → ${dest.replace(repoRoot, ".")}`);
}

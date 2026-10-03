import { describe, it, expect } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/* Selector gate driver (HOME-SYNC review FIX-R1).
 *
 * scripts/lib/local-gate.mjs assertLocalDeployment is a hard gate that
 * process.exit(1)s, so the honest driver is out-of-process: each probe
 * spawns a node child that imports the REAL module with
 * CONVEX_DEPLOYMENT set in its env and reports what happened.
 *
 * The refuse list is the R1–R3 attack list from
 * ak-redesign/00-control/history/HOME-SYNC-REVIEW.md verbatim (extra
 * segments/colons, cloud selectors incl. uppercase cloud shapes,
 * uppercase kind/prefix, whitespace around/inside the accepted name).
 * The accept list is every string the case-tolerant name segment added
 * (bb4ab7b) — each one is an anonymous-local or local deployment name
 * in Convex 1.34.1, per the review's CLI classification probes.
 *
 * RED proof: against the pre-bb4ab7b class [a-z0-9-]/[a-z0-9_-] the
 * three accept cases are refused (exit 1); every refuse case stays
 * refused. Outputs pasted in HOME-SYNC-FIX-R1.md. */

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GATE_URL = pathToFileURL(path.resolve(HERE, "..", "..", "scripts", "lib", "local-gate.mjs")).href;

function probe(selector: string) {
  return spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "--no-warnings",
      "-e",
      `import { assertLocalDeployment } from ${JSON.stringify(GATE_URL)};\n` +
        `process.stdout.write("RETURNED=" + assertLocalDeployment("gate-test"));\n`,
    ],
    { encoding: "utf8", env: { ...process.env, CONVEX_DEPLOYMENT: selector } },
  );
}

const REFUSES: [name: string, selector: string][] = [
  // extra segment — the CLI keeps only the LAST colon segment, so these
  // resolve in a cloud project while prefix-matching the local shape
  ["extra segment (prod name)", "anonymous:anonymous-x:energetic-kangaroo-55"],
  ["extra segment (local kind)", "local:local-foo:energetic-kangaroo-55"],
  ["extra segment (uppercase cloud name)", "anonymous:anonymous-x:Energetic-Kangaroo-55"],
  ["extra segment (uppercase local name)", "anonymous:anonymous-X:energetic-kangaroo-55"],
  // bare extra colon
  ["trailing colon", "anonymous:anonymous-x:"],
  ["double colon", "anonymous::anonymous-foo"],
  // cloud selectors — lowercase shape
  ["prod cloud", "prod:energetic-kangaroo-55"],
  ["dev cloud", "dev:energetic-kangaroo-55"],
  ["anonymous prefix, cloud name", "anonymous:energetic-kangaroo-55"],
  ["bare cloud name", "energetic-kangaroo-55"],
  // uppercase cloud shapes — case tolerance must NOT wave these through
  ["dev + uppercase cloud", "dev:Happy-Animal-123"],
  ["prod + uppercase cloud", "prod:Energetic-Kangaroo-55"],
  ["anonymous + uppercase cloud", "anonymous:Energetic-Kangaroo-55"],
  ["local + uppercase cloud", "local:Energetic-Kangaroo-55"],
  ["bare uppercase cloud", "Energetic-Kangaroo-55"],
  ["preview + uppercase branch", "preview:Feature-Branch"],
  // uppercase kind/prefix — only the NAME segment is case-tolerant
  ["uppercase kind", "ANONYMOUS:anonymous-CE-MVP"],
  ["uppercase name after kind", "anonymous:ANONYMOUS-ce-mvp"],
  ["capitalized kind", "Anonymous:anonymous-CE-MVP"],
  ["dev + local-shaped name", "dev:anonymous-CE-MVP"],
  ["prod + local-shaped name", "prod:anonymous-CE-MVP"],
  // whitespace — $ anchors and the class reject every variant
  ["leading space", " anonymous:anonymous-CE-MVP"],
  ["trailing space", "anonymous:anonymous-CE-MVP "],
  ["mid space", "anonymous:anonymous-CE MVP"],
  ["embedded tab", "anonymous:anonymous-CE\tMVP"],
  ["embedded newline", "anonymous:anonymous-CE\nMVP"],
  ["trailing newline", "anonymous:anonymous-CE-MVP\n"],
];

const ACCEPTS: [name: string, selector: string][] = [
  // this machine's auto-provisioned anonymous deployment (CLI derives the
  // name from the uppercase CE-MVP folder)
  ["anonymous, uppercase project name", "anonymous:anonymous-CE-MVP"],
  // linked-local shape local-<team>_<project> with an uppercase project
  ["local, underscore + uppercase project", "local:local-CE_MVP"],
  // review-classified: last segment still starts "anonymous-" so the CLI
  // stays on the anonymous local path even with uppercase inside
  ["anonymous, cloud-shaped uppercase name", "anonymous:anonymous-Energetic-Kangaroo-55"],
];

describe("local-gate assertLocalDeployment (selector shape gate)", () => {
  it.each(REFUSES)("refuses: %s", (_name, selector: string) => {
    const res = probe(selector);
    expect(res.status, `selector ${JSON.stringify(selector)} should exit 1`).toBe(1);
    expect(res.stderr).toMatch(/refusing to run/);
    expect(res.stderr).toContain(selector);
  });

  it.each(ACCEPTS)("accepts and returns: %s", (_name, selector: string) => {
    const res = probe(selector);
    expect(res.status, `selector ${JSON.stringify(selector)} should exit 0`).toBe(0);
    expect(res.stdout).toContain(`RETURNED=${selector}`);
  });
});

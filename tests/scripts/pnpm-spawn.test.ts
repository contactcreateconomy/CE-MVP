import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";

/* runPnpm spawn-order test (HOME-SYNC review FIX-R1).
 *
 * The %APPDATA% pnpm.cjs fallback (npm-global installs ship no pnpm.exe,
 * so spawnSync("pnpm", {shell:false}) cannot run the sh/.cmd shims) must
 * be used ONLY after plain `pnpm` fails to spawn. All three review asks:
 *   1. plain pnpm spawns + a fallback file exists  -> plain wins (order
 *      proof: fails if candidates are checked before the plain spawn)
 *   2. plain pnpm fails + APPDATA pnpm.cjs exists  -> node runs THAT file
 *   3. plain pnpm fails + no candidate anywhere    -> throws
 *
 * spawnSync and existsSync are mocked (existsSync answers from a per-test
 * set of "files on disk"), so no real spawn or directory layout is
 * involved and the result is machine-independent. RED/GREEN outputs are
 * pasted in ak-redesign/00-control/history/HOME-SYNC-FIX-R1.md. */

vi.mock("node:child_process", () => ({ spawnSync: vi.fn() }));
vi.mock("node:fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs")>();
  return { ...actual, existsSync: vi.fn() };
});

// imported AFTER the vi.mock calls (vitest hoists them above imports)
const { runPnpm } = await import("../../scripts/lib/session.mjs");

const spawnMock = vi.mocked(spawnSync);
const existsMock = vi.mocked(existsSync);

const FAKE_APPDATA = path.join(os.tmpdir(), "cemvp-pnpm-test-appdata");
const FAKE_CJS = path.join(FAKE_APPDATA, "npm", "node_modules", "pnpm", "bin", "pnpm.cjs");
const NODE_DIR_CJS = path.join(path.dirname(process.execPath), "node_modules", "pnpm", "bin", "pnpm.cjs");

/** Answers "does this path exist" from the per-test fake disk. */
let fakeDisk: Set<string>;
/** Plain `pnpm --version` probe result for this test (null = spawn error). */
let probeStatus: number | null;
let savedAppdata: string | undefined;

beforeEach(() => {
  fakeDisk = new Set();
  probeStatus = 0;
  spawnMock.mockReset();
  existsMock.mockImplementation((p) => fakeDisk.has(String(p)));
  spawnMock.mockImplementation((_bin, args) =>
    args?.[0] === "--version"
      ? probeStatus === null
        ? ({ status: null, error: new Error("spawn pnpm ENOENT") } as never)
        : ({ status: probeStatus, stdout: probeStatus === 0 ? "10.28.2\n" : "" } as never)
      : ({ status: 0 } as never),
  );
  savedAppdata = process.env.APPDATA;
});

afterEach(() => {
  if (savedAppdata === undefined) delete process.env.APPDATA;
  else process.env.APPDATA = savedAppdata;
});

/** The spawnSync call that ran ARGS (i.e. not the --version probe). */
function runCall(args: string[]) {
  const call = spawnMock.mock.calls.filter((c) => (c[1] ?? []).some((a) => a === args[0]))[0];
  if (!call) throw new Error(`runPnpm never spawned args starting with ${args[0]}`);
  return call;
}

describe("session.mjs runPnpm (pnpm.cjs fallback order)", () => {
  it("prefers plain `pnpm` when it spawns, even with a pnpm.cjs on disk (fallback only after plain fails)", () => {
    // probe succeeds AND the APPDATA fallback exists: plain must win.
    // This is the order proof — it fails if the candidate check is moved
    // before the plain spawn probe (see the RED run in HOME-SYNC-FIX-R1.md).
    process.env.APPDATA = FAKE_APPDATA;
    fakeDisk.add(FAKE_CJS);
    const res = runPnpm(["install"]);
    expect(res.status).toBe(0);
    const [bin, args] = runCall(["install"]);
    expect(bin).toBe("pnpm");
    expect(args).toEqual(["install"]);
    expect(bin).not.toBe(process.execPath); // did NOT go through node+pnpm.cjs
  });

  it("invokes node on the %APPDATA% pnpm.cjs when plain `pnpm` fails to spawn", () => {
    process.env.APPDATA = FAKE_APPDATA;
    fakeDisk.add(FAKE_CJS); // APPDATA candidate present, node-dir candidate absent
    probeStatus = null; // spawn error: sh/.cmd shim not runnable with shell:false
    const res = runPnpm(["install"]);
    expect(res.status).toBe(0);
    const [bin, args] = runCall(["install"]);
    expect(bin).toBe(process.execPath);
    expect(args?.[0]).toBe(FAKE_CJS);
    expect(args?.[1]).toBe("install");
    expect(NODE_DIR_CJS === FAKE_CJS).toBe(false); // sanity: the two candidates differ
  });

  it("falls back to the node-directory pnpm.cjs when APPDATA has none (candidate order)", () => {
    delete process.env.APPDATA;
    fakeDisk.add(NODE_DIR_CJS);
    probeStatus = 1; // nonzero probe: plain pnpm "ran" but failed
    runPnpm(["dev"]);
    const [bin, args] = runCall(["dev"]);
    expect(bin).toBe(process.execPath);
    expect(args?.[0]).toBe(NODE_DIR_CJS);
  });

  it("throws when plain pnpm fails and no pnpm.cjs candidate exists", () => {
    process.env.APPDATA = FAKE_APPDATA; // directory with no pnpm.cjs in it
    probeStatus = null;
    expect(() => runPnpm(["install"])).toThrow(/pnpm not spawnable/);
  });
});

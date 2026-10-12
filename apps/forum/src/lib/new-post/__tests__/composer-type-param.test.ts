/** L-89 — the Start sheet routes canonical postTypeConfig keys to the composer
 *  (?type=); the composer maps "help" to its legacy "qa" key client-side. The
 *  mapping shipped with the U3 sheet (composer-type-param.ts); these tests
 *  fence it. */
import { describe, expect, it } from "vitest";

import { composerTypeFromParam } from "../composer-type-param";

describe("composerTypeFromParam (L-89)", () => {
  it("maps the canonical help key to the composer's legacy qa key", () => {
    expect(composerTypeFromParam("help")).toBe("qa");
  });

  it("member-composable keys pass through unchanged", () => {
    expect(composerTypeFromParam("review")).toBe("review");
    expect(composerTypeFromParam("spark")).toBe("spark");
  });

  it("member-incomposable types fall back to the composer default (null)", () => {
    // news is platform-injected (CAP-086); launch-pad is not member-composable
    expect(composerTypeFromParam("news")).toBeNull();
    expect(composerTypeFromParam("launch_pad")).toBeNull();
    expect(composerTypeFromParam("nope")).toBeNull();
  });

  it("no param → null (the composer keeps its own default)", () => {
    expect(composerTypeFromParam(null)).toBeNull();
    expect(composerTypeFromParam(undefined)).toBeNull();
    expect(composerTypeFromParam("")).toBeNull();
  });
});

/** FEED-U1 — L-62 (Gravity as a unit), L-65 (Strings), L-63 (G-switch reason). */
import { describe, expect, it } from "vitest";

import { formatGravity, gSwitchReason, stringsLabel } from "../feed-format";

const THIN = " ";

describe("formatGravity (L-62)", () => {
  it("hidden at 0 (public Gravity starts at 0, nothing shown)", () => {
    expect(formatGravity(0)).toBeNull();
  });
  it("full digits up to 9,999 with a capital G", () => {
    expect(formatGravity(18)).toBe("18G");
    expect(formatGravity(1240)).toBe("1,240G");
    expect(formatGravity(9999)).toBe("9,999G");
  });
  it("above 9,999: compact with a thin space so it never reads as kilograms", () => {
    expect(formatGravity(10000)).toBe(`10K${THIN}G`);
    expect(formatGravity(12400)).toBe(`12.4K${THIN}G`);
    expect(formatGravity(1_250_000)).toBe(`1.3M${THIN}G`);
  });
});

describe("stringsLabel (L-65)", () => {
  it("empty → the invitation", () => {
    expect(stringsLabel(0)).toBe("No strings attached · start one");
  });
  it("singular / plural with thousands separators", () => {
    expect(stringsLabel(1)).toBe("1 string");
    expect(stringsLabel(24)).toBe("24 strings");
    expect(stringsLabel(1200)).toBe("1,200 strings");
  });
});

describe("gSwitchReason (L-63)", () => {
  it("off when the viewer has not interacted", () => {
    expect(gSwitchReason({})).toBeNull();
  });
  it("names every way the viewer slid in, in plain words", () => {
    expect(gSwitchReason({ appreciated: true })).toBe("You appreciated this");
    expect(gSwitchReason({ appreciated: true, saved: true })).toBe("You appreciated and saved this");
    expect(gSwitchReason({ commented: true, saved: true, shared: true })).toBe("You saved, commented on and shared this");
  });
});

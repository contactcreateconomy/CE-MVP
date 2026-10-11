/** FEED-B1 #3 — motion module matches FEED-DESIGN §11.2 / §7. */
import { describe, expect, it } from "vitest";

import { focusPull, motionFor, SPRINGS, STAGGER_S } from "../motion";

describe("motion (FEED-DESIGN §11.2)", () => {
  it("three spring families with the spec values", () => {
    expect(SPRINGS.feedback).toMatchObject({ type: "spring", stiffness: 520, damping: 34 });
    expect(SPRINGS.settle).toMatchObject({ type: "spring", stiffness: 260, damping: 30 });
    expect(SPRINGS.glide).toMatchObject({ type: "spring", stiffness: 140, damping: 22 });
  });

  it("focus pull: {opacity 0, blur 10px, scale 0.985, y 6} → sharp", () => {
    expect(focusPull.hidden).toEqual({ opacity: 0, filter: "blur(10px)", scale: 0.985, y: 6 });
    expect(focusPull.visible).toMatchObject({ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 });
  });

  it("children stagger 50ms", () => {
    expect(STAGGER_S).toBe(0.05);
    expect(motionFor(false).stagger.visible).toMatchObject({ transition: { staggerChildren: 0.05 } });
  });

  it("reduced motion → crossfades only (opacity, tweens, no stagger)", () => {
    const r = motionFor(true);
    expect(Object.keys(r.focusPull.hidden as object)).toEqual(["opacity"]);
    const visible = r.focusPull.visible as Record<string, unknown>;
    expect(Object.keys(visible).filter((k) => k !== "transition")).toEqual(["opacity"]);
    for (const t of Object.values(r.springs)) expect(t).toMatchObject({ type: "tween" });
    expect(r.stagger.visible).toMatchObject({ transition: { staggerChildren: 0 } });
    expect(motionFor(false).springs).toBe(SPRINGS);
  });
});

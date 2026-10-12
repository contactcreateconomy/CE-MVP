/* eslint-disable @typescript-eslint/no-explicit-any -- variant objects are untyped records */
/** FEED-B1 #3 — motion module matches FEED-DESIGN §11.2 / §7. */
import { spring } from "motion";
import { describe, expect, it } from "vitest";

import { focusPull, motionFor, SPRINGS, STAGGER_S } from "../motion";

describe("motion (FEED-DESIGN §11.2)", () => {
  it("three spring families with the spec values", () => {
    expect(SPRINGS.feedback).toMatchObject({ type: "spring", stiffness: 520 });
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
    // visible resets any SSR'd blur/scale/y INSTANTLY (duration 0) and only fades opacity
    const visible = r.focusPull.visible as Record<string, any>;
    expect(visible).toMatchObject({ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 });
    for (const k of ["filter", "scale", "y"]) expect(visible.transition[k]).toEqual({ duration: 0 });
    expect(visible.transition).toMatchObject({ type: "tween" });
    for (const t of Object.values(r.springs)) expect(t).toMatchObject({ type: "tween" });
    expect(r.stagger.visible).toMatchObject({ transition: { staggerChildren: 0 } });
    expect(motionFor(false).springs).toBe(SPRINGS);
  });

  it("feedback is critically damped and never overshoots (L-72, Bible §9.3)", () => {
    const { stiffness, damping } = SPRINGS.feedback;
    const ratio = damping / (2 * Math.sqrt(stiffness)); // mass 1
    expect(ratio).toBeGreaterThanOrEqual(1);
    expect(ratio).toBeLessThan(1.1); // ≈1.0 — not sluggish
    // drive motion's own spring generator 0 → 1 and watch every frame
    const gen = spring({ keyframes: [0, 1], ...SPRINGS.feedback });
    let peak = 0;
    for (let t = 0; t <= 1500; t += 4) peak = Math.max(peak, gen.next(t).value as number);
    expect(peak).toBeLessThanOrEqual(1 + 1e-6);
  });
});

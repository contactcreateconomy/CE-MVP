/**
 * motion — the feed's motion language (FEED-DESIGN §11.2, §7, §1).
 *
 * Character: elegant, calm, cinematic. Signature = the FOCUS PULL
 * ({opacity 0, blur 10px, scale 0.985, y 6px} → sharp), children stagger 50ms.
 *
 * Three spring families — pick by WHO caused the change and HOW BIG it is:
 *   feedback  520/34  presses, toggles (≤150ms feel)
 *   settle    260/30  user-caused state changes (200–300ms)
 *   glide     140/22  large surfaces, one-time data reveals (400–800ms, once)
 *
 * Rules (FEED-DESIGN §1 principles + §7 morph grammar):
 *  1. Solid while reading, fluid between moments: nothing reorders or moves
 *     under the user's eyes; system-caused changes wait for a boundary.
 *  2. User-caused morphs animate instantly (feedback/settle); system-caused
 *     morphs wait for a boundary (page, open, return).
 *  3. A morph never changes what the thing IS — same family, different depth.
 *  4. Hover adds depth, never layout. Every hover depth has a tap twin.
 *  5. Nothing animates outside the user's point of focus; one glow moment on
 *     screen at a time; reveals (glide) play once.
 *  6. prefers-reduced-motion → crossfades only: opacity tweens, no blur /
 *     scale / translate, no stagger. Use `motionFor(reduced)` or
 *     `useFeedMotion()` — never hand-roll a spring in a component.
 *  7. Admin surfaces: fade only.
 */
import { useSyncExternalStore } from "react";
import type { Transition, Variants } from "motion/react";

export const SPRINGS = {
  feedback: { type: "spring", stiffness: 520, damping: 34 },
  settle: { type: "spring", stiffness: 260, damping: 30 },
  glide: { type: "spring", stiffness: 140, damping: 22 },
} as const satisfies Record<string, Transition>;

export type SpringFamily = keyof typeof SPRINGS;

/** Children stagger, seconds (50ms = --duration-stagger-step). */
export const STAGGER_S = 0.05;

/** Reduced motion: every family becomes a short opacity crossfade
 *  (--duration-fast / --duration-normal / --duration-slow). */
const CROSSFADES: Record<SpringFamily, Transition> = {
  feedback: { type: "tween", duration: 0.16, ease: "easeOut" },
  settle: { type: "tween", duration: 0.2, ease: "easeOut" },
  glide: { type: "tween", duration: 0.3, ease: "easeOut" },
};

/** The signature focus pull. Use with initial="hidden" animate="visible". */
export const focusPull: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)", scale: 0.985, y: 6 },
  visible: { opacity: 1, filter: "blur(0px)", scale: 1, y: 0, transition: SPRINGS.glide },
};

/** Reduced: fade opacity only. `visible` also snaps blur/scale/y to rest
 *  with no animation, so markup rendered with full motion (SSR) never keeps
 *  a stuck blur or offset after the client switches to reduced motion. */
const focusPullReduced: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    filter: "blur(0px)",
    scale: 1,
    y: 0,
    transition: { ...CROSSFADES.glide, filter: { duration: 0 }, scale: { duration: 0 }, y: { duration: 0 } },
  },
};

const stagger: Variants = { hidden: {}, visible: { transition: { staggerChildren: STAGGER_S } } };
const staggerReduced: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0 } } };

export interface FeedMotion {
  springs: Record<SpringFamily, Transition>;
  focusPull: Variants;
  /** Parent variants: put on the container, focusPull on the children. */
  stagger: Variants;
}

export function motionFor(reduced: boolean): FeedMotion {
  return reduced
    ? { springs: CROSSFADES, focusPull: focusPullReduced, stagger: staggerReduced }
    : { springs: SPRINGS, focusPull, stagger };
}

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeReduced(onChange: () => void): () => void {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** OS reduced-motion setting, hydration-safe: the server (and hydration)
 *  render full motion, then the client switches if the user asked for less.
 *  (motion's own useReducedMotion caches a module-level value and can
 *  mismatch on hydration.) */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCED_QUERY).matches,
    () => false,
  );
}

/** Hook form of motionFor(): follows the OS reduced-motion setting. */
export function useFeedMotion(): FeedMotion {
  return motionFor(usePrefersReducedMotion());
}

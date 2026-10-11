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
import { useReducedMotion, type Transition, type Variants } from "motion/react";

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

const focusPullReduced: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: CROSSFADES.glide },
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

/** Hook form: reads the OS reduced-motion setting. */
export function useFeedMotion(): FeedMotion {
  return motionFor(useReducedMotion() ?? false);
}

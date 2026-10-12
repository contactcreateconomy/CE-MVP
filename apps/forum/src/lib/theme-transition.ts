/**
 * theme-transition — the theme switch (FEED-DESIGN L-67, Bible §9.4).
 *
 *   Iris (the chosen switch) — the new theme opens as a circle from the
 *   toggle the user pressed (origin = button centre), 360ms
 *   (--duration-modal-in, L-75: ≤ 400ms), --ease-emerge.
 *
 * Accepted exception (L-75) to Bible §9.2 rule 2 (never block input) and
 * rule 5 (animate transform/opacity only): a View Transition holds input for
 * its duration and Iris animates clip-path. Kept short (≤ 400ms) because the
 * switch is rare and user-caused; reduced motion uses a crossfade instead.
 *
 * Uses the View Transitions API (CSS in packages/design-tokens/utilities.css,
 * keyed on html[data-theme-switch]). No support → instant. Reduced motion →
 * a plain crossfade, never a moving edge (Bible §9.2 rule 11).
 *
 * The rejected Horizon candidate lives only in /lab/foundation (?v=b) with
 * its CSS in that folder; it is never shipped to product routes.
 */
import { flushSync } from "react-dom";

export type ThemeSwitchVariant = "iris" | "horizon";
export type ThemeSwitchResult = ThemeSwitchVariant | "fade" | "instant";
export type ThemeName = "light" | "dark";

interface ViewTransitionLike {
  finished: Promise<void>;
}

/** Flip the theme synchronously (the transition snapshots right after),
 *  then let next-themes persist it. */
export function applyTheme(to: ThemeName, setTheme: (theme: string) => void): void {
  document.documentElement.classList.toggle("dark", to === "dark");
  document.documentElement.style.colorScheme = to;
  flushSync(() => setTheme(to));
}

export function runThemeSwitch({
  apply,
  to,
  origin,
  reducedMotion = false,
  variant = "iris",
}: {
  /** Must update the DOM synchronously — use applyTheme(). */
  apply: () => void;
  to: ThemeName;
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
  /** Lab only: "horizon" needs the lab's horizon.css. */
  variant?: ThemeSwitchVariant;
}): ThemeSwitchResult {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };
  if (typeof doc.startViewTransition !== "function") {
    apply();
    return "instant";
  }
  const mode: ThemeSwitchResult = reducedMotion ? "fade" : variant;
  const root = document.documentElement;
  root.dataset.themeSwitch = mode;
  root.dataset.themeSwitchTo = to;
  const x = origin?.x ?? window.innerWidth / 2;
  const y = origin?.y ?? 0;
  root.style.setProperty("--theme-switch-x", `${x}px`);
  root.style.setProperty("--theme-switch-y", `${y}px`);
  // Radius that covers the farthest viewport corner from the origin.
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  root.style.setProperty("--theme-switch-r", `${Math.ceil(r)}px`);

  const transition = doc.startViewTransition(apply);
  void transition.finished.finally(() => {
    delete root.dataset.themeSwitch;
    delete root.dataset.themeSwitchTo;
  });
  return mode;
}

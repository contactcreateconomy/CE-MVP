/**
 * theme-transition — the two theme-switch candidates for O-04 (founder
 * picks in the browser; FEED-DESIGN §11.2). Lab-only until picked: `?v=a`
 * = Iris, `?v=b` = Horizon, no param = instant switch (today's behaviour).
 *
 *   Iris    — the new theme opens as a circle from the toggle the user
 *             pressed (origin = pointer / button centre).
 *   Horizon — the new theme arrives as a level line: dark falls from the
 *             top like dusk, light rises from the bottom like dawn.
 *
 * Both use the View Transitions API (CSS in packages/design-tokens/
 * utilities.css, keyed on html[data-theme-switch]). No support → instant.
 * Reduced motion → a plain crossfade, never a moving edge.
 */

export type ThemeSwitchVariant = "iris" | "horizon";
export type ThemeSwitchResult = ThemeSwitchVariant | "fade" | "instant";

export function themeSwitchVariant(param: string | null | undefined): ThemeSwitchVariant | null {
  if (param === "a") return "iris";
  if (param === "b") return "horizon";
  return null;
}

interface ViewTransitionLike {
  finished: Promise<void>;
}

export function runThemeSwitch({
  apply,
  variant,
  to,
  origin,
  reducedMotion = false,
}: {
  /** Must update the DOM synchronously (e.g. toggle the `.dark` class). */
  apply: () => void;
  variant: ThemeSwitchVariant | null;
  to: "light" | "dark";
  origin?: { x: number; y: number };
  reducedMotion?: boolean;
}): ThemeSwitchResult {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => ViewTransitionLike };
  if (!variant || typeof doc.startViewTransition !== "function") {
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

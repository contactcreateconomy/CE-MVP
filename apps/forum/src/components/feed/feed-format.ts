/**
 * Display formatting for the feed's two public numbers (L-64: only Gravity
 * and Strings are public on cards and posts).
 */

const THIN_SPACE = " ";
const full = new Intl.NumberFormat("en-US");

/** L-62 — Gravity is written as a unit, never the word: "18G", full digits
 *  up to 9,999 ("1,240G"), above that "12.4K G" with a thin space so it never
 *  reads as kilograms. 0 → null: nothing is shown until someone adds Gravity. */
export function formatGravity(n: number): string | null {
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 9999) return `${full.format(Math.round(n))}G`;
  const [div, unit] = n >= 1_000_000 ? [1_000_000, "M"] : [1000, "K"];
  const v = Math.round((n / div) * 10) / 10;
  return `${Number.isInteger(v) ? v : v.toFixed(1)}${unit}${THIN_SPACE}G`;
}

/** L-65 — Strings = comments. Empty invites the first one. */
export function stringsLabel(n: number): string {
  if (n <= 0) return "No strings attached · start one";
  return `${full.format(n)} ${n === 1 ? "string" : "strings"}`;
}

export interface ViewerInteractions {
  appreciated?: boolean;
  saved?: boolean;
  commented?: boolean;
  shared?: boolean;
}

/** L-63 — the G-switch is "on" once the viewer added Gravity in any way;
 *  the tooltip / SR text names why. null → switch off. */
export function gSwitchReason(i: ViewerInteractions): string | null {
  const parts = [
    i.appreciated && "appreciated",
    i.saved && "saved",
    i.commented && "commented on",
    i.shared && "shared",
  ].filter(Boolean) as string[];
  if (parts.length === 0) return null;
  const list = parts.length === 1 ? parts[0] : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `You ${list} this`;
}

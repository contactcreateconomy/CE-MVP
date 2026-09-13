/**
 * Handle normalization — the single CAP-474-discipline implementation.
 *
 * Formerly duplicated (and diverged): `profile/page.ts` normalized usernames
 * here-in-place while `auth.ts` derived `users.handle` with a cruder regex
 * (no NFKD, no combining-mark strip, 40-char cap, "." / "_" allowed from the
 * email local part) — "José" produced `jos-` as a handle but `jose` as a
 * username. Both paths now run through this one normalizer so the two handle
 * fields can never diverge again; callers only choose the SOURCE (name vs
 * email local part).
 */

/** CAP-474-discipline normalization for handles. */
const LATIN_SUPPLEMENT: Record<string, string> = { ø: "o", æ: "ae", ß: "ss", đ: "d", ł: "l", þ: "th" };
export function normalizeHandle(source: string): string {
  const slug = source
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining marks (Ü→u, not U-+dash)
    .replace(/[øæßđłþ]/g, (c) => LATIN_SUPPLEMENT[c]) // letters NFKD won't decompose
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return slug.length >= 3 ? slug : `member-${slug || "x"}`;
}

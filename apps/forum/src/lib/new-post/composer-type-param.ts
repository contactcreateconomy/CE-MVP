import { MEMBER_COMPOSABLE_CATEGORY_KEYS, type CategoryKey } from "@/types";

/**
 * /new-post?type=<post type> → the composer's initial type (FEED-U3: the
 * Start sheet routes a chosen type to the existing composer). Canonical
 * "help" is the composer's legacy "qa" key. Anything a member cannot compose
 * (news is platform-injected, CAP-086; locked or unknown types) → null, so
 * the composer keeps its own default.
 */
export function composerTypeFromParam(param: string | null | undefined): CategoryKey | null {
  if (!param) return null;
  const key = (param === "help" ? "qa" : param.replace("_", "-")) as CategoryKey;
  return MEMBER_COMPOSABLE_CATEGORY_KEYS.includes(key) ? key : null;
}

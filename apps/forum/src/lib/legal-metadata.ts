import type { Metadata } from "next";
import { fetchQuery } from "convex/nextjs";
import { isConvexConfigured, getConvexUrl } from "@cemvp/convex-client";

import { api } from "../../../../convex/_generated/api";

/**
 * CONTRACT-1-legal-pages §3 State 2 ("unavailable_pending_legal + noindex"
 * — served with noindex until M18 publish, CAP-027). Indexability of a
 * *published* legal page is an explicit Open Question (§7.4) — left at
 * the Next.js default (no robots override) rather than invented either
 * way.
 */
export async function getLegalMetadata(docKey: string): Promise<Metadata> {
  if (!isConvexConfigured()) return {};
  try {
    const doc = await fetchQuery(api.legalContent.getPublished, { docKey }, { url: getConvexUrl() ?? undefined });
    if (doc === null) {
      return { robots: { index: false, follow: false } };
    }
    return {};
  } catch {
    // CI/build-time fetch failure: fail closed to noindex rather than
    // silently indexing a page whose publish state we couldn't confirm.
    return { robots: { index: false, follow: false } };
  }
}

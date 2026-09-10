"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import type { Category } from "@/types";

interface SharedData {
  categories: Category[];
  categoriesLoading: boolean;
  unreadNotificationCount: number;
}

/** Post-type taxonomy per locked spec: 8 active types (news member-read-only, spark active); launch-pad/gigs DAU-locked. */
const FALLBACK_CATEGORIES: Category[] = [
  { key: "news", name: "News", icon: "newspaper", description: "", primaryColor: "var(--cat-news)" },
  { key: "review", name: "Review", icon: "star", description: "", primaryColor: "var(--cat-review)" },
  { key: "compare", name: "Compare", icon: "git-compare", description: "", primaryColor: "var(--cat-compare)" },
  { key: "qa", name: "Help", icon: "help-circle", description: "", primaryColor: "var(--cat-help)" },
  { key: "spark", name: "Spark", icon: "zap", description: "", primaryColor: "var(--cat-spark)" },
  { key: "debate", name: "Debate", icon: "swords", description: "", primaryColor: "var(--cat-debate)" },
  { key: "list", name: "List", icon: "layout-list", description: "", primaryColor: "var(--cat-list)" },
  { key: "showcase", name: "Showcase", icon: "sparkles", description: "", primaryColor: "var(--cat-showcase)" },
] as Category[];

const SharedDataContext = createContext<SharedData>({
  categories: FALLBACK_CATEGORIES,
  categoriesLoading: true,
  unreadNotificationCount: 0,
});

export function useSharedData() {
  return useContext(SharedDataContext);
}

function SharedDataProviderInner({ children }: { children: ReactNode }) {
  // P7-CLEANUP: the typed-post registry (postTypeConfig) — canonical source
  const rawCategories = useQuery(api.categories.listPostTypes, {});
  const notifications = useQuery(api.notifications.reads.list, {});

  // Display map (icon/color are client concerns) merged over canonical rows
  const DISPLAY: Record<string, { icon: string; primaryColor: string }> = {
    news: { icon: "newspaper", primaryColor: "var(--cat-news)" },
    review: { icon: "star", primaryColor: "var(--cat-review)" },
    compare: { icon: "git-compare", primaryColor: "var(--cat-compare)" },
    help: { icon: "help-circle", primaryColor: "var(--cat-help)" },
    qa: { icon: "help-circle", primaryColor: "var(--cat-help)" },
    spark: { icon: "zap", primaryColor: "var(--cat-spark)" },
    debate: { icon: "swords", primaryColor: "var(--cat-debate)" },
    list: { icon: "layout-list", primaryColor: "var(--cat-list)" },
    showcase: { icon: "sparkles", primaryColor: "var(--cat-showcase)" },
  };
  const rawRows = rawCategories as
    | Array<{ key: string; name: string; description: string; lockedByDefault?: boolean }>
    | undefined;
  const merged = (rawRows ?? []).map((c) => ({
    ...c,
    icon: DISPLAY[c.key]?.icon ?? "circle",
    primaryColor: DISPLAY[c.key]?.primaryColor ?? "var(--text-muted)",
  })) as Category[];

  const value: SharedData = {
    categories: merged.length > 0 ? merged : FALLBACK_CATEGORIES,
    categoriesLoading: rawCategories === undefined,
    unreadNotificationCount: (notifications as { unreadCount?: number } | undefined)
      ?.unreadCount ?? 0,
  };

  return <SharedDataContext.Provider value={value}>{children}</SharedDataContext.Provider>;
}

export function SharedDataProvider({ children }: { children: ReactNode }) {
  if (!isConvexConfigured()) {
    return (
      <SharedDataContext.Provider
        value={{ categories: FALLBACK_CATEGORIES, categoriesLoading: false, unreadNotificationCount: 0 }}
      >
        {children}
      </SharedDataContext.Provider>
    );
  }
  return <SharedDataProviderInner>{children}</SharedDataProviderInner>;
}

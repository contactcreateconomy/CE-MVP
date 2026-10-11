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

const FALLBACK_CATEGORIES: Category[] = [
  { key: "news", name: "News", icon: "newspaper", description: "", primaryColor: "#3B82F6" },
  { key: "review", name: "Review", icon: "star", description: "", primaryColor: "#8B5CF6" },
  { key: "compare", name: "Compare", icon: "git-compare", description: "", primaryColor: "#22C55E" },
  { key: "launch-pad", name: "Launch Pad", icon: "rocket", description: "", primaryColor: "#F59E0B" },
  { key: "debate", name: "Debate", icon: "swords", description: "", primaryColor: "#EF4444" },
  { key: "list", name: "List", icon: "layout-list", description: "", primaryColor: "#F97316" },
  { key: "showcase", name: "Showcase", icon: "sparkles", description: "", primaryColor: "#EC4899" },
  { key: "gigs", name: "Gigs", icon: "briefcase", description: "", primaryColor: "#EAB308" },
  { key: "qa", name: "Q&A", icon: "help-circle", description: "", primaryColor: "#14B8A6" },
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
  const rawCategories = useQuery(api.forum.queries.listCategories, {});
  const unreadCount = useQuery(api.forum.queries.getUnreadNotificationCount, {});

  const value: SharedData = {
    categories: (rawCategories as Category[] | undefined) ?? FALLBACK_CATEGORIES,
    categoriesLoading: rawCategories === undefined,
    unreadNotificationCount: unreadCount ?? 0,
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

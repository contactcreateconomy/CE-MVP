import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIPreferencesStore {
  feedSort: "hot" | "new" | "top" | "fav";
  setFeedSort: (sort: "hot" | "new" | "top" | "fav") => void;
  leftSidebarCollapsed: boolean;
  toggleLeftSidebar: () => void;
  contentViewMode: "min" | "max";
  setContentViewMode: (mode: "min" | "max") => void;
}

export const useUIPreferences = create<UIPreferencesStore>()(
  persist(
    (set) => ({
      feedSort: "hot",
      setFeedSort: (feedSort) => set({ feedSort }),
      leftSidebarCollapsed: false,
      toggleLeftSidebar: () =>
        set((s) => ({ leftSidebarCollapsed: !s.leftSidebarCollapsed })),
      contentViewMode: "min",
      setContentViewMode: (contentViewMode) => set({ contentViewMode }),
    }),
    { name: "ui-preferences" },
  ),
);

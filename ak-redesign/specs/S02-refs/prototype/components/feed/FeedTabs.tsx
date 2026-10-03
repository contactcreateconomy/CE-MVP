"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { FeedTab } from "@/lib/types";

interface FeedTabsProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

const TABS: { id: FeedTab; label: string; icon: string }[] = [
  { id: "top", label: "Top", icon: "🔥" },
  { id: "hot", label: "Hot", icon: "🔥" },
  { id: "new", label: "New", icon: "🆕" },
  { id: "fav", label: "Fav", icon: "⭐" },
];

export function FeedTabs({ activeTab, onTabChange }: FeedTabsProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-xl bg-muted/50 p-1"
      role="tablist"
      aria-label="Feed filters"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={cn(
            "relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200",
            activeTab === tab.id
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          role="tab"
          aria-selected={activeTab === tab.id}
          aria-controls={`feed-panel-${tab.id}`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId="activeTab"
              className="absolute inset-0 rounded-lg bg-primary glow-primary"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <span className="relative z-10">{tab.icon}</span>
          <span className="relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

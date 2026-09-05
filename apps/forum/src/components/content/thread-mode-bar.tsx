"use client";

import { AlertCircle, BookOpen, Clock, Lightbulb, Smile, TrendingUp, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Thread reading controls — reframed 2026-08-31 to align with the locked
 * reading-view / MAX-toggle / sort model (no parallel naming):
 *
 * - "Read"    → canonical reading view (default)
 * - "Insights"→ the MAX intelligence panel toggle (MAX on)
 * - "Q&A"     → the question/answer sort view of the SAME canonical comment set
 * - "Timeline"→ a chronological sort filter on the SAME canonical comment set
 *   (never an alternate structure — every mode renders the same comments,
 *   only ordered/filtered differently)
 *
 * Filter chips apply in reading + insights modes only.
 */

export type ViewMode = "read" | "insights" | "qa" | "timeline";

interface ThreadModeBarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  activeFilter: string | null;
  onFilterChange: (filter: string | null) => void;
  commentCount: number;
  themeCount: number;
  /** Filter chips only apply in reading / insights modes; hidden elsewhere to avoid dead UI. */
  showFilterChips: boolean;
}

const MODES: { value: ViewMode; label: string; icon: React.ElementType }[] = [
  { value: "read", label: "Reading view", icon: BookOpen },
  { value: "insights", label: "MAX insights", icon: Lightbulb },
  { value: "qa", label: "Q&A sort", icon: TrendingUp },
  { value: "timeline", label: "Chronological", icon: Clock },
];

const FILTERS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: "top-insights", label: "Top Insights", icon: TrendingUp },
  { value: "beginner", label: "Beginner-Friendly", icon: Smile },
  { value: "critical", label: "Critical", icon: AlertCircle },
  { value: "implementation", label: "Implementation", icon: Wrench },
];

export function ThreadModeBar({
  viewMode,
  onViewModeChange,
  activeFilter,
  onFilterChange,
  commentCount,
  themeCount,
  showFilterChips,
}: ThreadModeBarProps) {
  return (
    <div className="card-surface rounded-xl overflow-hidden">
      {/* Header line */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[var(--text-primary)]">Thread Map</span>
          <span className="text-xs text-[var(--text-muted)]">{themeCount} themes detected</span>
        </div>
        <span className="text-xs text-[var(--text-muted)]">{commentCount} comments</span>
      </div>

      {/* Mode tabs */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          {MODES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onViewModeChange(value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0",
                viewMode === value
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter chips — reading + insights only */}
      {showFilterChips && (
        <div className="px-4 pb-3 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {FILTERS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onFilterChange(activeFilter === value ? null : value)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1 rounded-full text-label-sm font-medium whitespace-nowrap border transition-colors flex-shrink-0",
                activeFilter === value
                  ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] border-[var(--brand-primary)]/30"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { Eye, MessageSquare, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeedThread } from "@/app/(app)/(content)/content/_seed";

interface ThreadIntelligencePanelProps {
  thread: SeedThread;
  activeTheme: string | null;
  onThemeClick: (themeId: string | null) => void;
}

function Sparkline({ data }: { data: { hour: number; value: number }[] }) {
  if (data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const W = 200;
  const H = 36;
  const points = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * W;
      const y = H - (d.value / max) * H;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full h-9"
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="var(--brand-primary)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
    </svg>
  );
}

const THEME_COLORS: Record<string, string> = {
  pricing: "bg-emerald-500",
  implementation: "bg-blue-500",
  cases: "bg-purple-500",
  tools: "bg-orange-500",
};

export function ThreadIntelligencePanel({ thread, activeTheme, onThemeClick }: ThreadIntelligencePanelProps) {
  const { stats, sparkline, aiThemes } = thread;

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[var(--border-subtle)] flex items-center gap-2">
        <Zap className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">Thread Intelligence</p>
      </div>

      {/* Live stats */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center gap-1">
              <Eye className="h-3 w-3 text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">{stats.viewersNow}</span>
            </div>
            <p className="text-micro text-[var(--text-muted)] mt-0.5">Watching</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <MessageSquare className="h-3 w-3 text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">{stats.repliesToday}</span>
            </div>
            <p className="text-micro text-[var(--text-muted)] mt-0.5">Replies today</p>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1">
              <Users className="h-3 w-3 text-[var(--text-muted)]" />
              <span className="text-sm font-bold text-[var(--text-primary)]">{stats.uniqueContributors}</span>
            </div>
            <p className="text-micro text-[var(--text-muted)] mt-0.5">Contributors</p>
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-3 opacity-70">
          <Sparkline data={sparkline} />
        </div>
      </div>

      {/* AI themes */}
      <div className="px-4 pb-3 border-t border-[var(--border-subtle)] pt-3">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2.5">AI Detected Themes</p>
        <div className="space-y-1.5">
          {aiThemes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeClick(activeTheme === theme.id ? null : theme.id)}
              className={cn(
                "w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors",
                activeTheme === theme.id
                  ? "bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/30"
                  : "hover:bg-[var(--bg-surface-elevated)] border border-transparent"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={cn("h-2 w-2 rounded-full flex-shrink-0", THEME_COLORS[theme.id] ?? "bg-gray-400")} />
                <span className="text-xs font-medium text-[var(--text-primary)] truncate">{theme.name}</span>
              </div>
              <span className="text-micro text-[var(--text-muted)] flex-shrink-0 ml-2">{theme.count}</span>
            </button>
          ))}
        </div>
        {activeTheme && (
          <button
            onClick={() => onThemeClick(null)}
            className="mt-2 text-xs text-[var(--brand-primary)] hover:underline"
          >
            Clear filter
          </button>
        )}
      </div>

    </div>
  );
}

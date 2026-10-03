"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRightCircle, Crown, Medal } from "lucide-react";
import { useMemo, useState } from "react";

import { formatPoints } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

type PodiumWindow = "24h" | "7d" | "1m";

interface PodiumRow {
  rank: number;
  userId: string;
  points: number;
  weeklyDelta: number;
  user: User | null;
}

interface PodiumWidgetProps {
  rows: PodiumRow[];
}

const filters: Array<{ key: PodiumWindow; label: string }> = [
  { key: "24h", label: "24H" },
  { key: "7d", label: "7D" },
  { key: "1m", label: "1M" },
];

const rankColors = {
  1: { ring: "#facc15", icon: "#facc15" },
  2: { ring: "#cbd5e1", icon: "#cbd5e1" },
  3: { ring: "#d97706", icon: "#d97706" },
  4: { ring: "#14b8a6", icon: "#14b8a6" },
  5: { ring: "#6366f1", icon: "#6366f1" },
} as const;

function pointsByWindow(row: PodiumRow, window: PodiumWindow) {
  if (window === "24h") {
    return Math.max(1200, Math.round(row.points * 0.23 + row.weeklyDelta * 2.2));
  }
  if (window === "1m") {
    return Math.round(row.points * 1.35 + row.weeklyDelta * 7.5);
  }
  return row.points;
}

export function PodiumWidget({ rows }: PodiumWidgetProps) {
  const [activeWindow, setActiveWindow] = useState<PodiumWindow>("1m");

  const topRows = useMemo(() => {
    return rows
      .map((row) => ({ ...row, windowPoints: pointsByWindow(row, activeWindow) }))
      .sort((a, b) => b.windowPoints - a.windowPoints)
      .slice(0, 5)
      .map((row, index) => ({ ...row, displayRank: index + 1 }));
  }, [activeWindow, rows]);

  const activeFilterIndex = filters.findIndex((filter) => filter.key === activeWindow);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Podium</h2>

        <div className="relative w-[160px] rounded-full border border-[var(--border-default)] bg-[var(--bg-overlay)]/50 p-1">
          <div
            className="pointer-events-none absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-[var(--brand-primary)] transition-transform duration-300 ease-out shadow-[0_8px_20px_rgba(14,165,233,0.24)]"
            style={{ transform: `translateX(${activeFilterIndex * 100}%)` }}
          />

          <div className="relative z-10 grid grid-cols-3">
            {filters.map((filter) => {
              const isActive = activeWindow === filter.key;
              return (
                <button
                  key={filter.key}
                  type="button"
                  onClick={() => setActiveWindow(filter.key)}
                  className={cn(
                    "h-6 rounded-full px-2 text-[10px] font-semibold transition-colors duration-200",
                    isActive ? "text-black" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  )}
                >
                  {filter.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {topRows.map((row) => {
          const colors = rankColors[row.displayRank as keyof typeof rankColors];
          const showShimmer = row.displayRank <= 3;
          const Icon = row.displayRank <= 3 ? Crown : Medal;

          return (
            <div
              key={row.userId}
              className={`group relative flex items-center justify-between overflow-hidden rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-overlay)]/45 px-3 py-2.5 ${
                showShimmer ? "hover:border-[var(--border-prominent)]" : ""
              }`}
            >
              {showShimmer ? (
                <span className="pointer-events-none absolute inset-y-0 left-[-35%] w-[35%] -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100" />
              ) : null}

              <div className="relative z-10 flex min-w-0 items-center gap-2.5">
                <Icon className="h-4 w-4 shrink-0" style={{ color: colors.icon }} />

                <span
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--bg-surface)]"
                  style={{ boxShadow: `0 0 0 2px ${colors.ring}` }}
                >
                  {row.user?.avatar ? (
                    <Image
                      src={row.user.avatar}
                      alt={row.user.name}
                      width={32}
                      height={32}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-[var(--text-primary)]">
                      {(row.user?.name ?? "U")
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </span>
                  )}
                </span>

                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {row.user?.name ?? "Unknown user"}
                </p>
              </div>

              <p className="relative z-10 text-xs font-semibold text-[var(--feedback-warning)]">
                {formatPoints(row.windowPoints)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex w-full justify-center">
        <Link
          href="/leaderboard"
          aria-label="Open full leaderboard"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--brand-primary)] transition-all duration-200 hover:bg-[var(--bg-overlay)]/55 hover:text-[var(--brand-primary-hover)] hover:shadow-[0_0_12px_rgba(14,165,233,0.3)]"
        >
          <ArrowRightCircle className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

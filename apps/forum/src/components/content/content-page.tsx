"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bookmark, Share2, Bell, Users, MessageSquare } from "lucide-react";
import { PostBlock } from "./post-block";
import { ReplyComposer } from "./reply-composer";
import { ThreadModeBar, type ViewMode } from "./thread-mode-bar";
import { CommentThread } from "./comment-thread";
import { CreatorPanel } from "./creator-panel";
import { ThreadIntelligencePanel } from "./thread-intelligence-panel";
import { EngagementPanel } from "./engagement-panel";
import { ReadingProgressBar, ScrollToTop } from "@/components/ui/reading-affordances";
import { cn } from "@/lib/utils";
import { fmtCount } from "@/lib/format";
import ModeToggle from "@/components/ui/toggle-switch";
import type { SeedThread, SeedComment } from "@/app/(app)/(content)/content/_seed";

export interface ContentPageProps {
  mode: "max" | "minimal";
  thread: SeedThread;
  comments: SeedComment[];
  onModeChange?: (mode: "max" | "minimal") => void;
}

// ─── Toast ──────────────────────────────────────────────────────────────────

function ContentToast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDismiss, 2000);
    return () => clearTimeout(id);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-24 lg:bottom-8 left-1/2 z-toast -translate-x-1/2 rounded-menu border border-[var(--border-prominent)] bg-[var(--bg-surface-elevated)] px-4 py-2.5 text-center text-sm text-[var(--text-primary)] shadow-lg animate-soft-float-up">
      {message}
    </div>
  );
}

// ─── Sticky Header ─────────────────────────────────────────────────────────

function ContentGlobalHeader({ thread, commentCount, mode, onModeChange }: { thread: SeedThread; commentCount: number; mode: "max" | "minimal"; onModeChange?: (mode: "max" | "minimal") => void }) {
  return (
    <div className="sticky top-14 z-50 bg-[var(--bg-canvas)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
      <div className="mx-auto max-w-[1440px] px-4 lg:px-8 h-11 flex items-center gap-3">
        <p className="text-xs font-medium text-[var(--text-secondary)] truncate flex-1 min-w-0">
          {thread.title}
        </p>

        {onModeChange && (
          <div className="flex-shrink-0">
            <ModeToggle
              value={mode === "max" ? "max" : "min"}
              onChange={(v) => onModeChange(v === "max" ? "max" : "minimal")}
            />
          </div>
        )}

        <div className="hidden md:flex items-center gap-3 flex-shrink-0 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {fmtCount(commentCount)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {thread.stats.viewersNow} viewing
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)] transition-colors">
            <Bell className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)] transition-colors">
            <Bookmark className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-secondary)] transition-colors">
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export function ContentPage({ mode, thread, comments, onModeChange }: ContentPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("read");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [activeTheme, setActiveTheme] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);

  const isMinimal = mode === "minimal";

  const totalComments = useMemo(() => {
    function countAll(cs: SeedComment[]): number {
      return cs.reduce((acc, c) => acc + 1 + countAll(c.replies ?? []), 0);
    }
    return countAll(comments);
  }, [comments]);

  return (
    <div className="min-h-screen">
      <ContentGlobalHeader thread={thread} commentCount={totalComments} mode={mode} onModeChange={onModeChange} />
      <ReadingProgressBar />

      <div className="mx-auto max-w-[1440px] px-4 lg:px-8 pt-6 pb-20">
        <div className="flex gap-6 lg:gap-8 items-start">
          {/* Main column */}
          <div className="min-w-0 flex-1">
            <PostBlock thread={thread} mode={mode} />

            <div className="mt-4">
              <ReplyComposer mode={mode} />
            </div>

            {/* Thread Map — max mode gets all tabs, minimal gets read-only */}
            {!isMinimal && (
              <div className="mt-4">
                <ThreadModeBar
                  viewMode={viewMode}
                  onViewModeChange={(m) => {
                    setViewMode(m);
                    setActiveFilter(null);
                    setActiveTheme(null);
                  }}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                  commentCount={totalComments}
                  themeCount={thread.aiThemes.length}
                  showFilterChips={viewMode === "read" || viewMode === "insights"}
                />
              </div>
            )}

            <div className="mt-4">
              <CommentThread
                comments={comments}
                viewMode={isMinimal ? "read" : viewMode}
                activeFilter={isMinimal ? null : activeFilter}
                activeTheme={isMinimal ? null : activeTheme}
                onToast={showToast}
              />
            </div>
          </div>

          {/* Desktop sidebar */}
          <aside className={cn("hidden lg:block w-[300px] flex-shrink-0", isMinimal && "lg:hidden")}>
            {!isMinimal && (
              <div className="sticky top-[100px] space-y-4">
                <CreatorPanel
                  author={thread.author}
                  products={thread.creatorProducts}
                  liveSession={thread.liveSession}
                  mode={mode}
                  onToast={showToast}
                />
                <ThreadIntelligencePanel
                  thread={thread}
                  activeTheme={activeTheme}
                  onThemeClick={setActiveTheme}
                />
                <EngagementPanel thread={thread} mode={mode} />
              </div>
            )}
          </aside>
        </div>

        {/* Mobile sidebar — only in max mode */}
        {!isMinimal && (
          <div className="lg:hidden mt-8 space-y-4">
            <CreatorPanel
              author={thread.author}
              products={thread.creatorProducts}
              liveSession={thread.liveSession}
              mode={mode}
              onToast={showToast}
            />
            <ThreadIntelligencePanel
              thread={thread}
              activeTheme={activeTheme}
              onThemeClick={setActiveTheme}
            />
            <EngagementPanel thread={thread} mode={mode} />
          </div>
        )}

        {/* Minimal mode: compact creator card below comments */}
        {isMinimal && (
          <div className="mt-8">
            <CreatorPanel
              author={thread.author}
              products={[]}
              mode="minimal"
              onToast={showToast}
            />
          </div>
        )}
      </div>

      <ScrollToTop />
      {toast ? <ContentToast message={toast} onDismiss={() => setToast(null)} /> : null}
    </div>
  );
}

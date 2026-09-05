"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommentCard } from "./comment-card";
import type { SeedComment } from "@/app/(app)/(content)/content/_seed";
import type { ViewMode } from "./thread-mode-bar";

interface CommentThreadProps {
  comments: SeedComment[];
  viewMode: ViewMode;
  activeFilter: string | null;
  activeTheme: string | null;
  onToast?: (msg: string) => void;
}

type SortOrder = "top" | "new" | "old";

function flattenComments(comments: SeedComment[]): SeedComment[] {
  const result: SeedComment[] = [];
  for (const c of comments) {
    result.push(c);
    if (c.replies) result.push(...flattenComments(c.replies));
  }
  return result;
}

function sortComments(comments: SeedComment[], order: SortOrder): SeedComment[] {
  return [...comments].sort((a, b) => {
    if (order === "top") return b.upvotes - a.upvotes;
    if (order === "new") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
  });
}

// ─── Q&A Mode ───────────────────────────────────────────────────────────────

function QAMode({ comments, onToast }: { comments: SeedComment[]; onToast?: (msg: string) => void }) {
  const all = flattenComments(comments);
  const questions = all.filter((c) => c.isQuestion);
  const [selected, setSelected] = useState(questions[0]?.id ?? null);

  const answers = useMemo(() => {
    if (!selected) return [];
    const flat = flattenComments(comments);
    return flat.filter((c) => c.isAnswer && c.questionId === selected);
  }, [comments, selected]);

  if (questions.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[var(--text-muted)]">
        No questions found in this thread.
      </div>
    );
  }

  return (
    <div className="flex gap-4">
      {/* Question list */}
      <div className="w-[240px] flex-shrink-0 space-y-1">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-2">
          {questions.length} Questions
        </p>
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelected(q.id)}
            className={cn(
              "w-full text-left px-3 py-2.5 rounded-lg text-xs leading-snug transition-colors",
              selected === q.id
                ? "bg-[var(--brand-primary)]/10 text-[var(--text-primary)] border border-[var(--brand-primary)]/20"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent"
            )}
          >
            <span className="font-medium text-[var(--text-muted)] mr-1">Q:</span>
            {q.body.slice(0, 80)}
            {q.body.length > 80 && "…"}
          </button>
        ))}
      </div>

      {/* Answers */}
      <div className="flex-1 min-w-0">
        {selected && (
          <>
            {/* Selected question */}
            <div className="mb-3">
              {questions
                .filter((q) => q.id === selected)
                .map((q) => (
                  <CommentCard key={q.id} comment={q} showAiSummary isHighlighted onToast={onToast} />
                ))}
            </div>
            {/* Answers */}
            {answers.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
                  {answers.length} {answers.length === 1 ? "Answer" : "Answers"}
                </p>
                {answers.map((a) => (
                  <CommentCard key={a.id} comment={a} showAiSummary onToast={onToast} />
                ))}
              </div>
            ) : (
              <div className="py-4 text-sm text-[var(--text-muted)]">No answers yet for this question.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Timeline Mode ───────────────────────────────────────────────────────────

/**
 * Chronological sort of the SAME canonical comment set (2026-08-31 reframe):
 * not an alternate structure — every comment renders, oldest-first, with
 * timeline labels shown on milestones when present.
 */
function TimelineMode({ comments, onToast }: { comments: SeedComment[]; onToast?: (msg: string) => void }) {
  const ordered = useMemo(
    () =>
      flattenComments(comments).sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime(),
      ),
    [comments],
  );

  if (ordered.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[var(--text-muted)]">
        No comments yet.
      </div>
    );
  }

  return (
    <div className="relative pl-6">
      {/* Vertical line */}
      <div className="absolute left-2 top-0 bottom-4 w-px bg-[var(--border-subtle)]" />
      <div className="space-y-6">
        {ordered.map((c) => (
          <div key={c.id} className="relative">
            {/* Dot */}
            <div className="absolute -left-[18px] top-2 h-3 w-3 rounded-full bg-[var(--brand-primary)] border-2 border-[var(--bg-canvas)]" />
            {c.timelineLabel ? (
              <p className="text-micro font-semibold uppercase tracking-wide mb-1.5 text-[var(--brand-primary)]">
                {c.timelineLabel}
              </p>
            ) : null}
            <CommentCard comment={c} showAiSummary onToast={onToast} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function CommentThread({ comments, viewMode, activeFilter, activeTheme, onToast }: CommentThreadProps) {
  const [sortOrder, setSortOrder] = useState<SortOrder>("top");

  const filteredComments = useMemo(() => {
    const allFlat = flattenComments(comments);

    function applyTopicFilters(pool: SeedComment[]): SeedComment[] {
      let p = pool;
      if (activeTheme) {
        p = p.filter((c) => c.aiThemes.includes(activeTheme));
      }
      if (!activeFilter) return p;
      if (activeFilter === "top-insights") return p.filter((c) => c.isKey);
      if (activeFilter === "critical") return p.filter((c) => c.stance === "critique");
      if (activeFilter === "beginner") {
        return p.filter((c) => c.stance === "resource" || c.author.role === "new");
      }
      if (activeFilter === "implementation") {
        return p.filter((c) => c.aiThemes.includes("implementation"));
      }
      return p;
    }

    if (viewMode === "insights") {
      const keyed = allFlat.filter((c) => c.isKey);
      return sortComments(applyTopicFilters(keyed), sortOrder);
    }

    const hasFlatFilters = Boolean(activeTheme || activeFilter);
    if (!hasFlatFilters) {
      return sortComments(comments, sortOrder);
    }

    return sortComments(applyTopicFilters(allFlat), sortOrder);
  }, [comments, viewMode, activeFilter, activeTheme, sortOrder]);

  const isInsights = viewMode === "insights";
  const isFiltered = Boolean(activeTheme || activeFilter);

  if (viewMode === "qa") {
    return (
      <div>
        <QAMode comments={comments} onToast={onToast} />
      </div>
    );
  }

  if (viewMode === "timeline") {
    return (
      <div>
        <TimelineMode comments={comments} onToast={onToast} />
      </div>
    );
  }

  return (
    <div>
      {/* Sort bar — only in read mode when unfiltered */}
      {viewMode === "read" && !isFiltered && (
        <div className="flex items-center gap-2 mb-3">
          <ArrowUpDown className="h-3.5 w-3.5 text-[var(--text-muted)]" />
          <span className="text-xs text-[var(--text-muted)]">Sort:</span>
          {(["top", "new", "old"] as SortOrder[]).map((s) => (
            <button
              key={s}
              onClick={() => setSortOrder(s)}
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-lg transition-colors",
                sortOrder === s
                  ? "bg-[var(--bg-surface)] text-[var(--text-primary)] border border-[var(--border-default)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-xs text-[var(--text-muted)]">
            {filteredComments.length} comments
          </span>
        </div>
      )}

      {/* Insights header */}
      {isInsights && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-[var(--brand-primary)]/5 border border-[var(--brand-primary)]/15 flex items-center gap-2">
          <MessageSquare className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
          <p className="text-xs text-[var(--text-secondary)]">
            Showing {filteredComments.length} key comments surfaced by AI
          </p>
        </div>
      )}

      {/* Comment list */}
      {filteredComments.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--text-muted)]">
          No comments match the current filter.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => (
            <CommentCard
              key={comment.id}
              comment={comment}
              showAiSummary={isInsights || !!activeFilter}
              onToast={onToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}

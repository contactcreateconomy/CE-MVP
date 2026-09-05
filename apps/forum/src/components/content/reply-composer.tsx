"use client";

import { useState } from "react";
import { Sparkles, ShieldCheck, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { StanceTag } from "@/app/(app)/(content)/content/_seed";

type ComposerStance = StanceTag | null;

const STANCES: { value: StanceTag; label: string }[] = [
  { value: "question", label: "Question" },
  { value: "answer", label: "Answer" },
  { value: "story", label: "Experience" },
  { value: "critique", label: "Critique" },
  { value: "supportive", label: "Offer" },
];

const STANCE_ACTIVE: Record<StanceTag, string> = {
  question: "bg-blue-500/10 text-blue-600 border-blue-400/30 dark:text-blue-400",
  answer: "bg-emerald-500/10 text-emerald-600 border-emerald-400/30 dark:text-emerald-400",
  story: "bg-violet-500/10 text-violet-600 border-violet-400/30 dark:text-violet-400",
  critique: "bg-orange-500/10 text-orange-600 border-orange-400/30 dark:text-orange-400",
  supportive: "bg-cyan-500/10 text-cyan-600 border-cyan-400/30 dark:text-cyan-400",
  resource: "bg-amber-500/10 text-amber-600 border-amber-400/30 dark:text-amber-400",
};

interface ReplyComposerProps {
  mode?: "max" | "minimal";
}

export function ReplyComposer({ mode = "max" }: ReplyComposerProps) {
  const [text, setText] = useState("");
  const [stance, setStance] = useState<ComposerStance>(null);
  const [checkState, setCheckState] = useState<"idle" | "checking" | "ok">("idle");

  const isMinimal = mode === "minimal";
  const canPost = text.trim().length > 0;

  function handleCheck() {
    setCheckState("checking");
    setTimeout(() => setCheckState("ok"), 800);
  }

  return (
    <div className="card-surface rounded-xl overflow-hidden">
      <div className="px-4 pt-4 pb-2">
        <p className="text-sm font-semibold text-[var(--text-primary)]">Reply to thread</p>
      </div>

      <div className="px-4 pb-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Share your thoughts..."
          rows={isMinimal ? 3 : 4}
          className={cn(
            "w-full resize-none rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]",
            "px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "focus:outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/30",
            "transition-colors"
          )}
        />
      </div>

      {/* Stance selector — max mode only */}
      {!isMinimal && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1 flex-wrap">
            <span className="text-xs text-[var(--text-muted)] mr-1">Status:</span>
            {STANCES.map((s) => (
              <button
                key={s.value}
                onClick={() => setStance(stance === s.value ? null : s.value)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                  stance === s.value
                    ? STANCE_ACTIVE[s.value]
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-default)] hover:text-[var(--text-secondary)]"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action bar — simplified in minimal */}
      <div className="px-4 pb-4 flex items-center justify-between gap-3 border-t border-[var(--border-subtle)] pt-3">
        {!isMinimal ? (
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)] transition-colors">
              <Sparkles className="h-3.5 w-3.5 text-[var(--brand-primary)]" />
              Help me write
            </button>
            <button
              onClick={handleCheck}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors",
                checkState === "ok"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-elevated)]"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              {checkState === "checking" ? "Checking..." : checkState === "ok" ? "No issues" : "Check issues"}
            </button>
          </div>
        ) : (
          <div />
        )}
        <button
          disabled={!canPost}
          className={cn(
            "flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors",
            canPost
              ? "bg-[var(--brand-primary)] text-white hover:bg-[var(--brand-primary-hover)]"
              : "bg-[var(--bg-overlay)] text-[var(--text-disabled)] cursor-not-allowed"
          )}
        >
          <Send className="h-3.5 w-3.5" />
          Post
        </button>
      </div>
    </div>
  );
}

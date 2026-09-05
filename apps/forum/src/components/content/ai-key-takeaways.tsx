"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIKeyTakeawaysProps {
  takeaways: string[];
  defaultOpen?: boolean;
}

export function AIKeyTakeaways({ takeaways, defaultOpen = true }: AIKeyTakeawaysProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-surface-elevated)] transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[var(--brand-primary)]" />
          <span className="text-sm font-semibold text-[var(--text-primary)]">AI Key Takeaways</span>
          <span className="text-xs text-[var(--text-muted)] bg-[var(--bg-overlay)] px-1.5 py-0.5 rounded-full">
            {takeaways.length}
          </span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-4 w-4 text-[var(--text-muted)]" />
        )}
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-normal",
          open ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <ul className="px-4 pb-4 space-y-2.5">
          {takeaways.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-[5px] h-1.5 w-1.5 rounded-full bg-[var(--brand-primary)] flex-shrink-0" />
              <span className="text-sm text-[var(--text-secondary)] leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

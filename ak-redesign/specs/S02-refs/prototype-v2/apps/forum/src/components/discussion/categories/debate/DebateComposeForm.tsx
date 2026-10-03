"use client";

import { useCallback, useMemo } from "react";

import { cn } from "@/lib/utils";

interface DebateFields {
  motion: string;
  initialPosition: string;
}

const POSITION_OPTIONS = [
  { value: "for", label: "For" },
  { value: "against", label: "Against" },
  { value: "neutral", label: "Neutral" },
] as const;

export function DebateComposeForm({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (fields: Record<string, unknown>) => void;
}) {
  const fields: DebateFields = useMemo(() => ({
    motion: (value.motion as string) ?? "",
    initialPosition: (value.initialPosition as string) ?? "for",
  }), [value]);

  const emit = useCallback(
    (patch: Partial<DebateFields>) => {
      onChange({ ...fields, ...patch });
    },
    [fields, onChange],
  );

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Motion <span className="text-(--feedback-error)">*</span>
        </label>
        <input
          type="text"
          value={fields.motion}
          onChange={(e) => emit({ motion: e.target.value })}
          placeholder="e.g. Remote work is better for productivity"
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Initial position
        </label>
        <div className="flex flex-wrap gap-1.5">
          {POSITION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => emit({ initialPosition: opt.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                fields.initialPosition === opt.value
                  ? "border-(--brand-primary) bg-(--brand-primary)/15 text-(--brand-primary)"
                  : "border-(--border-default) text-(--text-secondary) hover:bg-(--bg-overlay)",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

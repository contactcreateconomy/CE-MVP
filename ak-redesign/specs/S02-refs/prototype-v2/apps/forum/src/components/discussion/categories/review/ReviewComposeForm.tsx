"use client";

import { Plus, Star, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

interface ReviewCriterion {
  id: string;
  label: string;
  score: number;
  maxScore: number;
  weightPercent: number;
}

interface ReviewFields {
  productName: string;
  productUrl: string;
  verdict: string;
  starRating: number;
  reviewerContextNote: string;
  verdictRationale: string;
  criteria: ReviewCriterion[];
}

const VERDICT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "caveats", label: "With Caveats" },
  { value: "not_recommended", label: "Not Recommended" },
] as const;

const DEFAULT_CRITERIA: ReviewCriterion[] = [
  { id: "c1", label: "Ease of Use", score: 4, maxScore: 5, weightPercent: 33 },
  { id: "c2", label: "Value for Money", score: 4, maxScore: 5, weightPercent: 33 },
  { id: "c3", label: "Performance", score: 4, maxScore: 5, weightPercent: 34 },
];

export function ReviewComposeForm({
  value,
  onChange,
}: {
  value: Record<string, unknown>;
  onChange: (fields: Record<string, unknown>) => void;
}) {
  const fields: ReviewFields = useMemo(() => ({
    productName: (value.productName as string) ?? "",
    productUrl: (value.productUrl as string) ?? "",
    verdict: (value.verdict as string) ?? "recommended",
    starRating: (value.starRating as number) ?? 4,
    reviewerContextNote: (value.reviewerContextNote as string) ?? "",
    verdictRationale: (value.verdictRationale as string) ?? "",
    criteria: (value.criteria as ReviewCriterion[]) ?? DEFAULT_CRITERIA,
  }), [value]);

  const [newCriterionLabel, setNewCriterionLabel] = useState("");

  const emit = useCallback(
    (patch: Partial<ReviewFields>) => {
      onChange({
        ...fields,
        ...patch,
        // Auto-generated defaults for user posts
        reviewerContextMax: [],
        sentiment: { agreePct: 0, disagreePct: 0, agreeQuote: "", disagreeQuote: "" },
        productLogo: "",
      });
    },
    [fields, onChange],
  );

  const addCriterion = useCallback(() => {
    const label = newCriterionLabel.trim();
    if (!label) return;
    const id = `c${Date.now()}`;
    const count = fields.criteria.length;
    const weight = count === 0 ? 100 : Math.floor(100 / (count + 1));
    const updated = fields.criteria.map((c) => ({ ...c, weightPercent: weight }));
    emit({
      criteria: [...updated, { id, label, score: 3, maxScore: 5, weightPercent: 100 - weight * count }],
    });
    setNewCriterionLabel("");
  }, [emit, fields.criteria, newCriterionLabel]);

  const removeCriterion = useCallback(
    (id: string) => {
      emit({ criteria: fields.criteria.filter((c) => c.id !== id) });
    },
    [emit, fields.criteria],
  );

  const updateCriterion = useCallback(
    (id: string, patch: Partial<ReviewCriterion>) => {
      emit({ criteria: fields.criteria.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
    },
    [emit, fields.criteria],
  );

  return (
    <div className="grid gap-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Product name <span className="text-(--feedback-error)">*</span>
        </label>
        <input
          type="text"
          value={fields.productName}
          onChange={(e) => emit({ productName: e.target.value })}
          placeholder="e.g. Figma, VS Code, Notion"
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Product URL (optional)
        </label>
        <input
          type="url"
          value={fields.productUrl}
          onChange={(e) => emit({ productUrl: e.target.value })}
          placeholder="https://..."
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Your context (optional)
        </label>
        <input
          type="text"
          value={fields.reviewerContextNote}
          onChange={(e) => emit({ reviewerContextNote: e.target.value })}
          placeholder="e.g. Freelance designer, daily user for 2 years"
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Verdict
        </label>
        <div className="flex flex-wrap gap-1.5">
          {VERDICT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => emit({ verdict: opt.value })}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                fields.verdict === opt.value
                  ? opt.value === "recommended"
                    ? "border-(--feedback-success) bg-(--feedback-success)/15 text-(--feedback-success)"
                    : opt.value === "not_recommended"
                      ? "border-(--feedback-error) bg-(--feedback-error)/15 text-(--feedback-error)"
                      : "border-(--feedback-warning) bg-(--feedback-warning)/15 text-(--feedback-warning)"
                  : "border-(--border-default) text-(--text-secondary) hover:bg-(--bg-overlay)",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Why this verdict? (optional)
        </label>
        <textarea
          value={fields.verdictRationale}
          onChange={(e) => emit({ verdictRationale: e.target.value })}
          placeholder="2-3 sentences explaining your verdict..."
          rows={2}
          className="w-full rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active) resize-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Star rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => emit({ starRating: n })}
              className="p-0.5 transition-transform hover:scale-110"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <Star
                className={cn(
                  "h-6 w-6",
                  n <= fields.starRating
                    ? "fill-(--feedback-warning) text-(--feedback-warning)"
                    : "text-(--text-muted)/40",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Criteria scorecard
        </label>
        <div className="space-y-2">
          {fields.criteria.map((c) => (
            <div key={c.id} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-sm text-(--text-primary)">{c.label}</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateCriterion(c.id, { score: n })}
                    className="p-0.5"
                  >
                    <Star
                      className={cn(
                        "h-3.5 w-3.5",
                        n <= c.score
                          ? "fill-(--feedback-warning) text-(--feedback-warning)"
                          : "text-(--text-muted)/30",
                      )}
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => removeCriterion(c.id)}
                className="rounded-full p-0.5 text-(--text-muted) hover:bg-(--bg-overlay) hover:text-(--text-primary)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex gap-1.5">
          <input
            type="text"
            value={newCriterionLabel}
            onChange={(e) => setNewCriterionLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCriterion();
              }
            }}
            placeholder="Add criterion, press Enter"
            className="flex-1 rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-1.5 text-sm text-(--text-primary) outline-hidden transition-colors placeholder:text-(--text-muted)/60 focus:border-(--border-active)"
          />
          <button
            type="button"
            onClick={addCriterion}
            className="rounded-lg border border-(--border-default) px-2 py-1 text-(--text-secondary) hover:bg-(--bg-overlay)"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

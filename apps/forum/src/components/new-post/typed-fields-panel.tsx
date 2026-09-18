"use client";

/**
 * TypedFieldsPanel — CONTRACT-2-compose §3.B (states 1/2/5): the seven
 * typed-form extension fields (`postReviews.toolId`/dimensions,
 * `postCompares.toolIds[2-4]`/`qualitativeGrid`, `postLists.mode`/`intro`,
 * `postShowcases.projectUrl`).
 *
 * Screen audit (2026-09-18): the single-composer cutover (B2, 2026-09-10)
 * kept the canonical `posts.createPost` write path — which already accepts
 * `toolIds` / `dimensionScores` / `projectUrl` and inserts the matching
 * extension row — but the composer UI never collected any of them
 * (`categoryFields` was dead state, restored from drafts only, never
 * written to by a control). That meant every review published with
 * `toolId: ""` (orphaned from the tool registry), every compare published
 * with `toolIds: []`, and showcase's `projectUrl` had no input at all
 * (its `postShowcases` insert was also missing the required
 * `approvalStatus` column — fixed alongside this in `convex/posts.ts`).
 * This panel closes that gap using ONLY existing §11.2 primitives — no
 * new component invented, per contract §6's own flagged gaps:
 *   - Compare's "2-4 tools" has no multi-select primitive in STYLE-KIT —
 *     composed from four single Selects instead of inventing one.
 *   - `qualitativeGrid` has no structured cell editor — free Textarea.
 *   - Verdict per-dimension score reuses the SAME Radio-button "1-5 + N/A
 *     on value_for_money only" pattern already shipped for `toolRatings`
 *     (`/tools/[slug]/rating-form.tsx`) rather than inventing a second one.
 */

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { isConvexConfigured } from "@cemvp/convex-client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/convex";
import type { CategoryKey } from "@/types";

export const REVIEW_DIMENSIONS = [
  { key: "ease_of_use", label: "Ease of use", allowNa: false },
  { key: "output_quality", label: "Output quality", allowNa: false },
  { key: "reliability", label: "Reliability", allowNa: false },
  { key: "value_for_money", label: "Value for money", allowNa: true },
] as const;

export interface TypedFieldsState {
  toolId: string;
  toolIds: [string, string, string, string];
  dimensionScores: Record<string, number | "not_applicable">;
  verdictSummary: string;
  pros: string;
  cons: string;
  qualitativeGrid: { useCase: string; workflow: string; limitations: string };
  listMode: "community_ranked" | "static_creator";
  listIntro: string;
  projectUrl: string;
}

export const EMPTY_TYPED_FIELDS: TypedFieldsState = {
  toolId: "",
  toolIds: ["", "", "", ""],
  dimensionScores: {},
  verdictSummary: "",
  pros: "",
  cons: "",
  qualitativeGrid: { useCase: "", workflow: "", limitations: "" },
  listMode: "community_ranked",
  listIntro: "",
  projectUrl: "",
};

/** Split a "one item per line" textarea into a trimmed, empty-line-free list. */
export function linesToList(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

const fieldClass =
  "w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm text-(--text-primary) outline-hidden focus:border-(--border-active)";

function ToolSelect({
  value,
  onChange,
  tools,
  placeholder,
  excludeIds,
}: {
  value: string;
  onChange: (v: string) => void;
  tools: Array<{ _id: string; name: string }>;
  placeholder: string;
  excludeIds: string[];
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {tools
          .filter((t) => t._id === value || !excludeIds.includes(t._id))
          .map((t) => (
            <SelectItem key={t._id} value={t._id}>
              {t.name}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}

function ScorePicker({
  label,
  value,
  onChange,
  allowNa,
}: {
  label: string;
  value: number | "not_applicable" | undefined;
  onChange: (v: number | "not_applicable") => void;
  allowNa: boolean;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium text-(--text-primary)">{label}</legend>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((s) => (
          <label key={s} className="cursor-pointer">
            <input
              type="radio"
              name={`typed-score-${label}`}
              value={s}
              checked={value === s}
              onChange={() => onChange(s)}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-default) text-sm text-(--text-secondary) peer-checked:border-(--brand-primary) peer-checked:bg-(--brand-primary)/10 peer-checked:font-semibold peer-checked:text-(--brand-primary)">
              {s}
            </span>
          </label>
        ))}
        {allowNa ? (
          <label className="cursor-pointer">
            <input
              type="radio"
              name={`typed-score-${label}`}
              value="not_applicable"
              checked={value === "not_applicable"}
              onChange={() => onChange("not_applicable")}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 items-center rounded-md border border-(--border-default) px-2 text-xs text-(--text-muted) peer-checked:border-(--border-active) peer-checked:text-(--text-secondary)">
              N/A
            </span>
          </label>
        ) : null}
      </div>
    </fieldset>
  );
}

export function TypedFieldsPanel({
  categoryKey,
  fields,
  onChange,
}: {
  categoryKey: CategoryKey;
  fields: TypedFieldsState;
  onChange: (next: TypedFieldsState) => void;
}) {
  const needsTools = categoryKey === "review" || categoryKey === "compare";
  const toolsResult = useQuery(
    api.tools.list,
    isConvexConfigured() && needsTools ? { numItems: 100 } : "skip",
  );
  const tools = useMemo(() => toolsResult?.tools ?? [], [toolsResult]);

  const set = <K extends keyof TypedFieldsState>(key: K, value: TypedFieldsState[K]) =>
    onChange({ ...fields, [key]: value });

  if (categoryKey === "review") {
    return (
      <div className="mb-6 space-y-4 rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Review verdict
        </h3>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-(--text-primary)" htmlFor="review-tool-select">
            Tool being reviewed
          </label>
          <ToolSelect
            value={fields.toolId}
            onChange={(v) => set("toolId", v)}
            tools={tools}
            excludeIds={[]}
            placeholder="Select a tool…"
          />
        </div>
        {REVIEW_DIMENSIONS.map((d) => (
          <ScorePicker
            key={d.key}
            label={d.label}
            value={fields.dimensionScores[d.key]}
            allowNa={d.allowNa}
            onChange={(v) => set("dimensionScores", { ...fields.dimensionScores, [d.key]: v })}
          />
        ))}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-(--text-primary)" htmlFor="review-verdict-summary">
            Verdict summary
          </label>
          <textarea
            id="review-verdict-summary"
            rows={2}
            value={fields.verdictSummary}
            onChange={(e) => set("verdictSummary", e.target.value)}
            placeholder="One or two sentences — your bottom line."
            className={fieldClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--text-primary)" htmlFor="review-pros">
              Pros (one per line)
            </label>
            <textarea
              id="review-pros"
              rows={3}
              value={fields.pros}
              onChange={(e) => set("pros", e.target.value)}
              className={fieldClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-(--text-primary)" htmlFor="review-cons">
              Cons (one per line)
            </label>
            <textarea
              id="review-cons"
              rows={3}
              value={fields.cons}
              onChange={(e) => set("cons", e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>
      </div>
    );
  }

  if (categoryKey === "compare") {
    return (
      <div className="mb-6 space-y-4 rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">
          Tools compared (2–4)
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {([0, 1, 2, 3] as const).map((i) => (
            <ToolSelect
              key={i}
              value={fields.toolIds[i]}
              onChange={(v) => {
                const next = [...fields.toolIds] as TypedFieldsState["toolIds"];
                next[i] = v;
                set("toolIds", next);
              }}
              tools={tools}
              excludeIds={fields.toolIds.filter((_, idx) => idx !== i)}
              placeholder={i < 2 ? `Tool ${i + 1} (required)` : `Tool ${i + 1} (optional)`}
            />
          ))}
        </div>
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-(--text-primary)">Qualitative grid</h4>
          {(
            [
              { key: "useCase" as const, label: "Use case", placeholder: "Who each tool fits best…" },
              { key: "workflow" as const, label: "Workflow", placeholder: "How they fit into a day-to-day workflow…" },
              { key: "limitations" as const, label: "Limitations", placeholder: "Where each tool falls short…" },
            ]
          ).map((cell) => (
            <div key={cell.key} className="space-y-1.5">
              <label className="text-sm text-(--text-secondary)" htmlFor={`compare-grid-${cell.key}`}>
                {cell.label}
              </label>
              <textarea
                id={`compare-grid-${cell.key}`}
                rows={2}
                value={fields.qualitativeGrid[cell.key]}
                onChange={(e) => set("qualitativeGrid", { ...fields.qualitativeGrid, [cell.key]: e.target.value })}
                placeholder={cell.placeholder}
                className={fieldClass}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (categoryKey === "list") {
    return (
      <div className="mb-6 space-y-4 rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">List setup</h3>
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-medium text-(--text-primary)">Mode</legend>
          <div className="flex flex-wrap gap-4" role="radiogroup" aria-label="List mode">
            {(
              [
                { value: "community_ranked" as const, label: "Community-ranked (members can vote items)" },
                { value: "static_creator" as const, label: "Static (creator-ordered)" },
              ]
            ).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm text-(--text-secondary)">
                <input
                  type="radio"
                  name="list-mode"
                  value={opt.value}
                  checked={fields.listMode === opt.value}
                  onChange={() => set("listMode", opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-(--text-primary)" htmlFor="list-intro">
            Intro
          </label>
          <textarea
            id="list-intro"
            rows={2}
            value={fields.listIntro}
            onChange={(e) => set("listIntro", e.target.value)}
            placeholder="Who this list is for and the inclusion rules."
            className={fieldClass}
          />
        </div>
      </div>
    );
  }

  if (categoryKey === "showcase") {
    return (
      <div className="mb-6 space-y-1.5 rounded-lg border border-(--border-subtle) bg-(--bg-surface) p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Project link</h3>
        <label className="text-sm font-medium text-(--text-primary)" htmlFor="showcase-project-url">
          The single controlled outbound link (optional)
        </label>
        <input
          id="showcase-project-url"
          type="url"
          value={fields.projectUrl}
          onChange={(e) => set("projectUrl", e.target.value)}
          placeholder="https://your-project.example.com"
          className={fieldClass}
        />
        <p className="text-xs text-(--text-muted)">
          Submitted for operator approval on publish (CAP-100) — HTTPS only, allowlisted domains, no
          embedded credentials or IP-literal hosts.
        </p>
      </div>
    );
  }

  return null;
}

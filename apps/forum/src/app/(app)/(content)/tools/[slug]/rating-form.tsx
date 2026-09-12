/* eslint-disable @typescript-eslint/no-explicit-any -- Convex results untyped at the client edge */
"use client";

/**
 * RatingForm — CONTRACT-2-tool-profile States 4–9 (the KNOWN-UI-GAPS #2
 * surface, backend shipped in P4-05): submit with 1–5 + N/A controls
 * (N/A ONLY on value_for_money — W2-E6), edit mode for the owner's active
 * rating (CAP-113), withdraw with confirmation (CAP-117), and server
 * rejections surfaced verbatim (R-STAFF/R-ONE — reject, not UI-hide).
 *
 * Archetype note (contract §6): §11 has NO rating-input composite — built
 * from Radio-style primitives only; no star widget invented.
 */

import { useState } from "react";
import { useMutation } from "convex/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { api } from "@/lib/convex";

const DIMENSIONS = ["ease_of_use", "output_quality", "reliability", "value_for_money"] as const;
const DIMENSION_LABELS: Record<string, string> = {
  ease_of_use: "Ease of use",
  output_quality: "Output quality",
  reliability: "Reliability",
  value_for_money: "Value for money",
};
const SCORES = [1, 2, 3, 4, 5];

type DimScores = Record<string, number | "not_applicable">;

interface RatingFormProps {
  toolId: string;
  toolStatus: string;
  myRating: {
    ratingId: string;
    overallScore: number;
    dimensionScores: DimScores;
    reviewText?: string;
  } | null;
}

function ScorePicker({
  label, value, onChange, allowNa,
}: {
  label: string;
  value: number | "not_applicable" | null;
  onChange: (v: number | "not_applicable") => void;
  allowNa?: boolean;
}) {
  return (
    <fieldset className="space-y-1">
      <legend className="text-sm font-medium text-(--text-primary)">{label}</legend>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
        {SCORES.map((s) => (
          <label key={s} className="cursor-pointer">
            <input
              type="radio" name={label} value={s}
              checked={value === s}
              onChange={() => onChange(s)}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-(--border-default) text-sm text-(--text-secondary) peer-checked:border-(--brand-primary) peer-checked:bg-(--brand-primary)/10 peer-checked:font-semibold peer-checked:text-(--brand-primary)">
              {s}
            </span>
          </label>
        ))}
        {allowNa && (
          <label className="cursor-pointer">
            <input
              type="radio" name={label} value="not_applicable"
              checked={value === "not_applicable"}
              onChange={() => onChange("not_applicable")}
              className="peer sr-only"
            />
            <span className="inline-flex h-8 items-center rounded-md border border-(--border-default) px-2 text-xs text-(--text-muted) peer-checked:border-(--border-active) peer-checked:text-(--text-secondary)">
              N/A
            </span>
          </label>
        )}
      </div>
    </fieldset>
  );
}

export function RatingForm({ toolId, toolStatus, myRating }: RatingFormProps) {
  const submit = useMutation(api.toolRatings.submit);
  const update = useMutation(api.toolRatings.update);
  const withdraw = useMutation(api.toolRatings.withdraw);

  const editing = myRating !== null;
  const [overall, setOverall] = useState<number | null>(editing ? myRating.overallScore : null);
  const [dims, setDims] = useState<DimScores>(
    editing ? { ...myRating.dimensionScores } : {},
  );
  const [reviewText, setReviewText] = useState(editing ? (myRating.reviewText ?? "") : "");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  // CAP-119: archived → aggregate frozen, no longer rated
  if (toolStatus === "archived") return null;

  const allDimsSet = DIMENSIONS.every((d) => dims[d] !== undefined);
  const canSave = overall !== null && allDimsSet && !busy;

  async function onSave() {
    setBusy(true); setError(null); setNote(null);
    try {
      const payload = {
        overallScore: overall as number,
        dimensionScores: {
          ease_of_use: dims.ease_of_use as number,
          output_quality: dims.output_quality as number,
          reliability: dims.reliability as number,
          value_for_money: dims.value_for_money as number | "not_applicable",
        },
        reviewText: reviewText.trim() || undefined,
      };
      if (editing) {
        await update({ ratingId: myRating.ratingId as any, ...payload });
        setNote("Rating updated — the aggregate delta was applied atomically.");
      } else {
        await submit({ toolId: toolId as any, ...payload });
        setNote("Rating submitted. N/A dimensions count toward neither sum nor count.");
      }
    } catch (e: any) {
      // Reject, not UI-hide (State 8): server rejections surface verbatim —
      // RATING_STAFF_FORBIDDEN (403), R-ONE duplicate, day-1 verification.
      setError(e?.message ?? "Rating rejected");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 pb-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">
          {editing ? "Your rating" : "Rate this tool"}
        </h2>
      </CardHeader>
      <CardContent className="space-y-4 p-4 pt-0">
        <ScorePicker label="Overall" value={overall} onChange={(v) => setOverall(v as number)} />
        {DIMENSIONS.map((d) => (
          <ScorePicker
            key={d}
            label={DIMENSION_LABELS[d]}
            value={(dims[d] ?? null) as number | "not_applicable" | null}
            onChange={(v) => setDims((prev) => ({ ...prev, [d]: v }))}
            allowNa={d === "value_for_money"}
          />
        ))}
        <div className="space-y-1">
          <label htmlFor="review-text" className="text-sm font-medium text-(--text-primary)">
            Review (optional)
          </label>
          <textarea
            id="review-text" value={reviewText} rows={3} maxLength={2000}
            onChange={(e) => setReviewText(e.target.value)}
            className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm"
          />
          <p className="text-xs text-(--text-muted)">{reviewText.length} / 2000</p>
        </div>
        {error && (
          <p className="text-sm text-(--feedback-error)" role="alert">{error}</p>
        )}
        {note && (
          <p className="text-sm text-(--feedback-success)" role="status">{note}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button disabled={!canSave} onClick={onSave}>
            {editing ? "Save changes" : "Submit rating"}
          </Button>
          {editing && (
            <Button variant="destructive" disabled={busy} onClick={() => setWithdrawOpen(true)}>
              Withdraw
            </Button>
          )}
        </div>
        {editing && myRating !== null && (
          <p className="text-xs text-(--text-muted)">
            Withdrawn ratings are excluded from the community aggregate and can be re-rated later.
          </p>
        )}
        <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Withdraw your rating?</DialogTitle>
              <DialogDescription>
                Your rating is removed from the community aggregate immediately and its review text
                stops being displayed. You can rate this tool again later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setWithdrawOpen(false)}>Cancel</Button>
              <Button
                variant="destructive" disabled={busy}
                onClick={async () => {
                  if (!myRating) return;
                  setBusy(true); setError(null);
                  try {
                    await withdraw({ ratingId: myRating.ratingId as any });
                    setWithdrawOpen(false);
                    setNote("Rating withdrawn — the aggregate was decremented.");
                  } catch (e: any) {
                    setError(e?.message ?? "Withdraw failed");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Withdraw rating
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

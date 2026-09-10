/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * ReportModal — SLICE-P7E-12 (CAP-324/325): report a COMMENT (H6 —
 * settled target). The reporter picks a policyFamily from the bible
 * enum ONLY (contract §1: "ENTITY UNCLEAR must not propagate"); the
 * l.239 dedupe means many reports → one open case — the UI says so
 * (volume ≠ guilt).
 */

import { useState } from "react";
import { useMutation } from "convex/react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/convex";

const FAMILIES: { key: string; label: string; hint: string }[] = [
  { key: "spam", label: "Spam or manipulation", hint: "Promotional, repetitive, or coordinated" },
  { key: "harassment_abuse", label: "Harassment or abuse", hint: "Targeted at a person" },
  { key: "misinformation", label: "Misinformation", hint: "False or misleading claims" },
  { key: "copyright_ip", label: "Copyright / IP", hint: "Routes to legal intake" },
  { key: "quality_guidelines", label: "Off-topic / low quality", hint: "Wrong place or low substance" },
  { key: "safety_illegal", label: "Illegal or unsafe", hint: "Highest severity — fastest review" },
];

export function ReportModal({ commentId, open, onOpenChange }: { commentId: string | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const submit = useMutation(api.moderation.report.submit);
  const [family, setFamily] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Report this comment</DialogTitle>
          <DialogDescription>
            One review case exists per issue — additional reports on the same comment join the same case.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          {FAMILIES.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFamily(f.key)}
              className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                family === f.key
                  ? "border-(--border-active) bg-(--bg-overlay)/60"
                  : "border-(--border-subtle) hover:bg-(--bg-overlay)/40"
              }`}
            >
              <span className="font-medium text-(--text-primary)">{f.label}</span>
              <span className="block text-xs text-(--text-muted)">{f.hint}</span>
            </button>
          ))}
        </div>
        {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!family || busy || !commentId}
            onClick={() => {
              if (!family || !commentId) return;
              setBusy(true);
              void submit({ commentId: commentId as any, policyFamily: family as any })
                .then((r) => setNote(r.alreadyReported ? "Joined the existing open case." : "Reported — the review case is open."))
                .catch((e) => setNote(String(e?.message ?? e)))
                .finally(() => setBusy(false));
            }}
          >
            Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Briefcase, Calendar, MapPin } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/ui/user-avatar";
import { cn } from "@/lib/utils";
import type { DiscussionThread } from "@/types/discussion";
import type { User } from "@/types";

import { BriefToast } from "../../brief-toast";
import { FormattedBody } from "../../formatted-body";

export function GigsBody({
  thread,
  isMax,
  author,
  ensureAuthenticated,
}: {
  thread: Extract<DiscussionThread, { category: "gigs" }>;
  isMax: boolean;
  author: User | null;
  ensureAuthenticated: () => boolean;
}) {
  const b = thread.categoryBody;
  const requiredSkills = b.requiredSkills ?? [];
  const preferredSkills = b.preferredSkills ?? [];
  const stages = b.stages?.length ? b.stages : ["Applied", "Screening", "Interview", "Offer"];
  const processStage = b.processStage ?? "applied";

  const [applyOpen, setApplyOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [checks, setChecks] = useState<boolean[]>(() => requiredSkills.map(() => false));

  const matched = checks.filter(Boolean).length;
  const fitLabel =
    requiredSkills.length === 0 || matched >= requiredSkills.length - 1
      ? "You're a strong fit → Apply"
      : `You're missing ${requiredSkills.length - matched} required — consider applying anyway`;

  const stageIndex = stages.findIndex((s) => s.toLowerCase().startsWith(processStage));

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-xl font-semibold text-(--text-primary)">{b.roleTitle}</h2>
          <div className="flex flex-wrap gap-2 text-sm text-(--text-secondary)">
            <span className="inline-flex items-center gap-1 rounded-full border border-(--border-default) px-2 py-0.5">
              <Briefcase className="h-3.5 w-3.5" /> {b.employment}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-(--border-default) px-2 py-0.5">
              <MapPin className="h-3.5 w-3.5" /> {b.location}
            </span>
            {b.budget ? (
              <span className="rounded-full border border-(--border-default) px-2 py-0.5">{b.budget}</span>
            ) : (
              <span className="rounded-full border border-(--feedback-warning)/40 bg-(--feedback-warning)/10 px-2 py-0.5 text-(--feedback-warning)">
                Budget incomplete
              </span>
            )}
            {b.duration ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-(--border-default) px-2 py-0.5">
                <Calendar className="h-3.5 w-3.5" /> {b.duration}
              </span>
            ) : (
              <span className="rounded-full border border-(--feedback-warning)/40 bg-(--feedback-warning)/10 px-2 py-0.5 text-(--feedback-warning)">
                Duration incomplete
              </span>
            )}
            {b.startDate ? <span className="text-xs text-(--text-muted)">Start {b.startDate}</span> : null}
          </div>
        </CardContent>
      </Card>

      <div>
        <p className="text-xs font-semibold text-(--text-muted)">Required</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {requiredSkills.map((s) => (
            <span key={s} className="rounded-full bg-(--brand-primary)/15 px-3 py-1 text-xs font-medium text-(--text-primary)">
              {s}
            </span>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-(--text-muted)">Preferred</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {preferredSkills.map((s) => (
            <span key={s} className="rounded-full border border-(--border-default) px-3 py-1 text-xs text-(--text-secondary)">
              {s}
            </span>
          ))}
        </div>
      </div>

      <div className="border-l-4 border-(--brand-primary) bg-(--bg-inset) py-3 pl-4 pr-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-(--text-primary)">
          <UserAvatar user={author} size="md" className="h-8 w-8" />
          From the poster
        </div>
        <p className="mt-2 text-sm text-(--text-secondary)">{b.posterNote}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {b.isOpen ? (
          <Button
            type="button"
            onClick={() => {
              if (!ensureAuthenticated()) return;
              setApplyOpen(true);
            }}
          >
            Apply Now →
          </Button>
        ) : (
          <span className="rounded-full bg-(--bg-overlay) px-3 py-1 text-sm font-medium text-(--text-muted)">Position closed</span>
        )}
        <span className="text-sm text-(--text-secondary)">{b.applicantCount} applied</span>
        <span className="text-sm text-(--text-muted)">{b.isOpen ? "Open" : "Closed"}</span>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-(--text-muted)">Process</p>
        <div className="flex flex-wrap gap-2">
          {stages.map((s, i) => (
            <span
              key={s}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium",
                i === stageIndex ? "bg-(--brand-primary) text-white" : "bg-(--bg-overlay) text-(--text-secondary)",
              )}
            >
              {s}
            </span>
          ))}
        </div>
      </div>

      {isMax ? (
        <Card>
          <CardContent className="space-y-3 p-4">
            <p className="text-sm font-semibold text-(--text-primary)">How well do you fit?</p>
            {requiredSkills.map((s, i) => (
              <label key={s} className="flex items-center gap-2 text-sm text-(--text-secondary)">
                <input
                  type="checkbox"
                  checked={checks[i]}
                  onChange={(e) => {
                    const next = [...checks];
                    next[i] = e.target.checked;
                    setChecks(next);
                  }}
                />
                {s}
              </label>
            ))}
            <p className="text-sm text-(--text-primary)">
              You match {matched} of {requiredSkills.length} required skills.
            </p>
            <p className="text-xs text-(--text-muted)">{fitLabel}</p>
          </CardContent>
        </Card>
      ) : null}

      <Dialog.Root open={applyOpen} onOpenChange={setApplyOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(480px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-(--border-default) bg-(--bg-surface) p-4 shadow-(--shadow-lg)">
            <Dialog.Title className="text-base font-semibold text-(--text-primary)">Apply</Dialog.Title>
            <form
              className="mt-4 grid gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setApplyOpen(false);
                setToast("Application submitted");
              }}
            >
              <input required className="rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm" placeholder="Name" />
              <input required type="email" className="rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm" placeholder="Email" />
              <input required className="rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm" placeholder="Portfolio / LinkedIn URL" />
              <textarea required className="min-h-[100px] rounded-lg border border-(--border-default) bg-(--bg-inset) px-3 py-2 text-sm" placeholder="Why you?" />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setApplyOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {toast ? <BriefToast message={toast} onDismiss={() => setToast(null)} /> : null}

      <FormattedBody body={thread.body} />
    </div>
  );
}

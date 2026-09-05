"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { DiscussionThread, QaBody } from "@/types/discussion";

export function QaInsights({ thread }: { thread: DiscussionThread }) {
  const b = thread.categoryBody as QaBody;
  const steps = b.diagnosticSteps ?? [];
  if (steps.length === 0) return null;
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs font-semibold uppercase text-(--text-muted)">Troubleshooting path</p>
        <ul className="mt-2 space-y-2 text-sm text-(--text-secondary)">
          {steps.map((s, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className={s.tried ? "text-(--feedback-success)" : "text-(--text-muted)"}>{s.tried ? "✓" : "○"}</span>
              {s.label}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

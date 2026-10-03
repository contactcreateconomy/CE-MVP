import { Inbox } from "lucide-react";

import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  ctaLabel?: string;
}

export function EmptyState({ title, description, ctaLabel }: EmptyStateProps) {
  return (
    <div className="card-surface flex min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center">
      <Inbox className="h-10 w-10 text-[var(--text-muted)]" />
      <h2 className="text-xl font-semibold text-[var(--text-primary)]">{title}</h2>
      <p className="max-w-sm text-sm text-[var(--text-secondary)]">{description}</p>
      {ctaLabel ? <Button variant="secondary">{ctaLabel}</Button> : null}
    </div>
  );
}

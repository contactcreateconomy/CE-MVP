import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title: string;
  description: string;
}

export function ErrorState({ title, description }: ErrorStateProps) {
  return (
    <div className="card-surface flex min-h-[260px] flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertTriangle className="h-10 w-10 text-(--feedback-error)" />
      <h2 className="text-xl font-semibold text-(--text-primary)">{title}</h2>
      <p className="max-w-sm text-sm text-(--text-secondary)">{description}</p>
      <Button variant="destructive">Retry</Button>
    </div>
  );
}

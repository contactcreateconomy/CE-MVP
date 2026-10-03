/**
 * Route: /drafts
 * Auth requirement: Member recommended (placeholder route for personal drafts)
 * Data dependencies: viewer drafts list, autosave metadata, last edited timestamps
 * Backend endpoints needed:
 * - GET /api/posts/drafts
 * - PATCH /api/posts/drafts/:id
 * - DELETE /api/posts/drafts/:id
 */
import { FileClock } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DraftsPage() {
  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <FileClock className="h-5 w-5" /> My Drafts
          </h1>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">How I built an AI workflow for client onboarding</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Last edited 2h ago</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
            <p className="text-sm font-semibold text-[var(--text-primary)]">10 mistakes creators make while prompt packaging</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">Last edited yesterday</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

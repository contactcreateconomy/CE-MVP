/**
 * Route: /campaigns
 * Auth requirement: Optional
 * Data dependencies: active campaigns
 * Backend endpoints needed:
 * - GET /api/campaigns/active
 */
import { Flag } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getCampaigns } from "@/lib/adapters/content";
import { formatRelativeDate } from "@/lib/format";

export default function CampaignsPage() {
  const campaigns = getCampaigns();

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-[var(--text-primary)]">
            <Flag className="h-5 w-5" /> Campaigns
          </h1>
        </CardHeader>

        <CardContent className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">{campaign.title}</p>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">{campaign.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-[var(--text-muted)]">
                <span>{campaign.participants.toLocaleString()} participants</span>
                <span>Ends {formatRelativeDate(campaign.endsAt)}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

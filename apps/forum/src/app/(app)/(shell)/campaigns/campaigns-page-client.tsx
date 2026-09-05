"use client";

import { useQuery } from "convex/react";
import { Flag } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { formatRelativeDate } from "@/lib/format";
import { isConvexConfigured } from "@cemvp/convex-client";

function CampaignsPageWithConvex() {
  const campaigns = useQuery(api.forum.queries.listCampaigns, {});

  if (campaigns === undefined) {
    return null;
  }

  return (
    <section className="animate-route-emerge space-y-4">
      <Card>
        <CardHeader>
          <h1 className="inline-flex items-center gap-2 text-2xl font-semibold text-(--text-primary)">
            <Flag className="h-5 w-5" /> Campaigns
          </h1>
        </CardHeader>

        <CardContent className="space-y-3">
          {campaigns.map((campaign) => (
            <div key={campaign.id} className="rounded-md border border-(--border-default) bg-(--bg-surface) p-3">
              <p className="text-sm font-semibold text-(--text-primary)">{campaign.title}</p>
              <p className="mt-1 text-xs text-(--text-secondary)">{campaign.description}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-(--text-muted)">
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

export function CampaignsPageClient() {
  if (!isConvexConfigured()) {
    return <p className="text-sm text-(--text-muted)">Connect Convex to load campaigns.</p>;
  }

  return <CampaignsPageWithConvex />;
}

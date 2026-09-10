/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/utm — SLICE-P7O-06 (CAP-566/479): dictionary + read-only
 * generator. Empty dictionary = disabled dropdowns + guidance (States B).
 * Generate writes NOTHING (CAP-479); landing capture stays P2-08.
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { api } from "../../../../../../../convex/_generated/api";

export default function AdminUtmPage() {
  const dict = useQuery(api.admin.utm?.getDictionary, {});
  const seedEdit = useMutation(api.admin.utm?.dictionarySeedEdit);
  const [source, setSource] = useState("");
  const [medium, setMedium] = useState("");
  const [campaign, setCampaign] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  const empty = Boolean((dict as any)?.empty);
  const sources: string[] = (dict as any)?.allowedSources ?? [];
  const mediums: string[] = (dict as any)?.allowedMediums ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">UTM Builder</h1>
      {empty ? (
        <Card>
          <CardContent className="space-y-2 py-6">
            <p className="text-sm text-(--text-secondary)">{(dict as any)?.guidance}</p>
            <Button size="sm" onClick={() => void seedEdit({
              allowedSources: ["newsletter", "community", "partner", "social"],
              allowedMediums: ["email", "referral", "post"],
              campaignFormat: "snake_case", contentFormat: "free_text",
            }).then((r) => setNote(`Dictionary seeded at v${r.version}.`)).catch((e) => setNote(String(e?.message ?? e)))}>
              Seed defaults (CAP-566)
            </Button>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Generate (read-only — CAP-479)</h2></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-3">
            <select value={source} onChange={(e) => setSource(e.target.value)} disabled={empty} aria-label="utm_source" className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm">
              <option value="">source…</option>
              {sources.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={medium} onChange={(e) => setMedium(e.target.value)} disabled={empty} aria-label="utm_medium" className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm">
              <option value="">medium…</option>
              {mediums.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="campaign" disabled={empty} aria-label="utm_campaign" className="rounded-md border border-border-default bg-bg-surface px-3 py-2 text-sm" />
          </div>
          <Button
            size="sm"
            disabled={empty || !source || !medium || !campaign.trim()}
            onClick={() => {
              // Pure client-side build from dictionary members only
              const url = `https://createconomy.com/?utm_source=${encodeURIComponent(source)}&utm_medium=${encodeURIComponent(medium)}&utm_campaign=${encodeURIComponent(campaign.trim())}`;
              if (url.length > 80 + "https://createconomy.com/".length) {
                setNote("Combined length exceeds the dictionary budget.");
                setLink(null);
                return;
              }
              setLink(url);
              setNote(null);
            }}
          >
            Generate
          </Button>
          {link ? (
            <div className="flex items-center gap-2">
              <code className="rounded bg-(--bg-overlay) px-2 py-1 text-xs text-(--text-primary)">{link}</code>
              <Button variant="ghost" size="sm" onClick={() => void navigator.clipboard?.writeText(link).then(() => setNote("Copied."))}>Copy</Button>
            </div>
          ) : null}
          {note ? <p className="text-xs text-(--text-muted)">{note}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}

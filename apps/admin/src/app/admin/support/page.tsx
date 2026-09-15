/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/support — SLICE-P7A-07/08 (CAP-402–406, CAP-020/024/029):
 * the support_operator console. Quota grant (≤5·≤7d·1 active·unique
 * incident, confirm-modal), neutralize, timezone.fix (the canonical
 * mutation), audit-only notes, and the MASKED user summary (allowlist
 * projection — email/mobile/token never render, CAP-029 quoted).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/convex";

export default function AdminSupportPage() {
  const [userIdInput, setUserIdInput] = useState("");
  const [extra, setExtra] = useState("3");
  const [incidentId, setIncidentId] = useState("");
  const [grantReason, setGrantReason] = useState("");
  const [tz, setTz] = useState("Asia/Kolkata");
  const [tzReason, setTzReason] = useState("");
  const [note, setNote] = useState("");
  const [noteTarget, setNoteTarget] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const summary = useQuery(
    api.admin.support?.userSummary,
    userIdInput ? { userId: userIdInput as any } : "skip",
  );
  const grant = useMutation(api.admin.support?.quotaGrant);
  const neutralize = useMutation(api.admin.support?.quotaNeutralize);
  const timezoneFix = useMutation(api.admin.support?.timezoneFix);
  const noteCreate = useMutation(api.admin.support?.noteCreate);

  const run = (fn: Promise<any>, ok: string) =>
    fn.then(() => setFeedback(ok)).catch((e) => setFeedback(String(e?.message ?? e)));

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">Support Console</h1>
      <p className="text-xs text-text-muted">
        Rate limit 30/h per operator (staff NOT exempt — CAP-020). Member summaries are masked: standing, timezone, grant counts, case counts only.
      </p>

      {/* Masked summary (CAP-406/029) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Member summary (masked)</h2></CardHeader>
        <CardContent className="space-y-2">
          <Input value={userIdInput} onChange={(e) => setUserIdInput(e.target.value)} placeholder="member user id" aria-label="Member id" />
          {summary && summary.state === "ok" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Stat label="Standing" value={String(summary.standing)} />
              <Stat label="Timezone" value={String(summary.timezone ?? "unset")} />
              <Stat label="Active grants" value={String(summary.quotaGrants?.active ?? 0)} />
              <Stat label="Open cases" value={String(summary.openCaseCount ?? 0)} />
              <div className="rounded-md border border-border-subtle p-3">
                <p className="text-xs text-(--text-muted)">Restrictions</p>
                {(summary.restrictedCapabilities ?? []).length === 0 ? (
                  <p className="text-sm text-(--text-primary)">none</p>
                ) : (
                  (summary.restrictedCapabilities ?? []).map((k: string) => <Badge key={k} tone="warning">{k}</Badge>)
                )}
              </div>
            </div>
          ) : summary && summary.state === "not_found" ? (
            <p className="text-sm text-(--text-muted)">No member at that id.</p>
          ) : null}
          <p className="text-xs text-(--text-muted)">
            Never surfaced here: email, mobile, auth identifiers, raw case evidence (CAP-029).
          </p>
        </CardContent>
      </Card>

      {/* Quota grant (CAP-402/403) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Quota grant</h2></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="extra acquires (≤5)" aria-label="Extra acquires" />
            <Input value={incidentId} onChange={(e) => setIncidentId(e.target.value)} placeholder="incident id (unique per grant)" aria-label="Incident id" />
          </div>
          <Input value={grantReason} onChange={(e) => setGrantReason(e.target.value)} placeholder="reason" aria-label="Grant reason" />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!userIdInput || !incidentId || !grantReason.trim()}
              onClick={() =>
                run(
                  grant({ userId: userIdInput as any, extraAcquires: Number(extra), incidentId: incidentId as any, reason: grantReason }),
                  "Grant created (≤7d expiry).",
                )
              }
            >
              Grant
            </Button>
            <Button
              variant="secondary" size="sm" disabled={!incidentId}
              onClick={() => run(neutralize({ grantId: incidentId as any }), "Note: neutralize takes the GRANT id.")}
            >
              Neutralize (by grant id)
            </Button>
          </div>
          <p className="text-xs text-(--text-muted)">≤5 extra acquires · ≤7d · max 1 active/user · unique incident · &gt;3/90d escalates to Admin (CAP-432).</p>
        </CardContent>
      </Card>

      {/* Timezone fix (CAP-404 — the canonical mutation) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Timezone fix</h2></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Input value={tz} onChange={(e) => setTz(e.target.value)} placeholder="Asia/Kolkata" aria-label="IANA timezone" />
            <Input value={tzReason} onChange={(e) => setTzReason(e.target.value)} placeholder="reason" aria-label="Timezone reason" />
          </div>
          <Button size="sm" disabled={!userIdInput || !tzReason.trim()} onClick={() => run(timezoneFix({ userId: userIdInput as any, timezone: tz, reason: tzReason }), "Timezone corrected (audited).")}>
            support.timezone.fix
          </Button>
        </CardContent>
      </Card>

      {/* Note (CAP-405 — audit-only) */}
      <Card>
        <CardHeader><h2 className="text-sm font-semibold uppercase tracking-wide text-text-muted">Support note (audit-only)</h2></CardHeader>
        <CardContent className="space-y-2">
          <Input value={noteTarget} onChange={(e) => setNoteTarget(e.target.value)} placeholder="member user id" aria-label="Note target" />
          <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="note" aria-label="Note" />
          <Button size="sm" disabled={!noteTarget || !note.trim()} onClick={() => run(noteCreate({ userId: noteTarget as any, note }), "Note recorded in the audit log.")}>
            Record note
          </Button>
        </CardContent>
      </Card>

      {feedback ? <p className="text-xs text-(--text-muted)">{feedback}</p> : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle p-3">
      <p className="text-xs text-(--text-muted)">{label}</p>
      <p className="text-sm font-medium text-(--text-primary)">{value}</p>
    </div>
  );
}

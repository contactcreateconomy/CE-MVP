/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/moderation — SLICE-P7E-14 (CAP-330 console).
 * One A12 QueueBoard, many targetTypes — the CAP-330 order (s0 → legal →
 * s1 → appeals → s2 → s3) is server-side in listQueue; report count is
 * DISPLAYED but never sorted on (quoted). Claim/lease/renew + resolve +
 * the five-verb batch live as case-card actions (E-mod-2: no sub-tabs).
 */

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QueueBoard, type QueueCase } from "@/components/ui/queue-board";

const ORDER_LABELS = ["S0 · Critical", "Legal", "S1 · High", "Appeals near bound", "S2 · Medium", "S3 · Low"];

export default function AdminModerationPage() {
  const queue = useQuery(api.admin.moderationQueue?.listQueue, {});
  const claim = useMutation(api.admin.moderationQueue?.claim);
  const renew = useMutation(api.admin.moderationQueue?.renewLease);
  const resolve = useMutation(api.admin.moderationQueue?.resolve);
  const runBatch = useMutation(api.admin.moderationQueue?.batch);
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const cases: any[] = (queue as any)?.cases ?? [];

  // Board rows in QueueCase shape; groupOrder hands A12 the CAP-330 bands
  const boardCases: QueueCase[] = cases.map((c) => ({
    id: c.id,
    title: `${c.reasonCode} — ${c.targetType}`,
    targetType: c.targetType,
    severity:
      c.status === "appealed" ? "s1_high"
      : c.severity === "s0_critical" ? "s0_critical"
      : c.severity === "s1_high" ? "s1_high"
      : c.severity === "s2_medium" ? "s2_medium"
      : "s3_low",
    statusLabel: c.leaseExpired ? `${c.status} (lease expired)` : c.status,
    ageLabel: `${Math.max(0, Math.round((Date.now() - c.createdAt) / 60000))}m old · ${c.reporterCountDistinct} reporter(s)`,
    agedOut: c.agingLevel >= 2,
    leaseExpired: Boolean(c.leaseExpired),
  }));

  const act = (fn: Promise<any>, ok: string) =>
    fn.then(() => setNote(ok)).catch((e) => setNote(String(e?.message ?? e)));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-text-primary">Moderation Console</h1>
        <Badge tone="neutral">{cases.length} cases</Badge>
      </div>
      <p className="text-xs text-text-muted">
        Order: s0 → legal → s1 → appeals near bound → s2 → s3 · oldest first · report count never orders.
      </p>

      <QueueBoard
        cases={boardCases}
        loading={queue === undefined}
        groupBy={(c) => ORDER_LABELS[Math.min(5, Number((c as any).severity === "s0_critical" ? 0 : 5))]}
        groupOrder={ORDER_LABELS}
        renderActions={(c) => {
          const row = cases.find((r) => r.id === c.id);
          if (!row) return null;
          return (
            <div className="flex flex-wrap items-center gap-1">
              {row.status !== "claimed" ? (
                <Button variant="ghost" size="sm" onClick={() => void act(claim({ caseId: row.id }), "Claimed (20m lease).")}>
                  Claim
                </Button>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => void act(renew({ caseId: row.id }), "Lease renewed (+5m).")}>
                  Renew lease
                </Button>
              )}
              {row.severity === "s2_medium" || row.severity === "s3_low" ? (
                <>
                  <Button variant="ghost" size="sm" onClick={() => void act(resolve({ caseId: row.id, decision: "actioned", reason: "console" }), "Resolved (actioned).")}>
                    Action
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => void act(resolve({ caseId: row.id, decision: "resolved_no_action", reason: "console" }), "Resolved (no action).")}>
                    No action
                  </Button>
                </>
              ) : (
                <Badge tone="warning">Full review flow</Badge>
              )}
              <label className="ml-2 flex items-center gap-1 text-xs text-text-muted">
                <input
                  type="checkbox"
                  checked={selected.includes(row.id)}
                  onChange={(e) =>
                    setSelected((prev) => (e.target.checked ? [...prev, row.id] : prev.filter((id) => id !== row.id)))
                  }
                />
                Batch
              </label>
            </div>
          );
        }}
      />

      {/* CAP-335 batch — five allowlisted verbs, max 25, never critical/legal/ban-class */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 py-4">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Batch ({selected.length}/25)
          </span>
          {(
            [
              ["resolve_no_action", "Resolve (no action)"],
              ["action_content", "Action content"],
              ["restore_content", "Restore content"],
              ["close_duplicate", "Close duplicate"],
              ["triage_escalate", "Triage"],
            ] as const
          ).map(([verb, label]) => (
            <Button
              key={verb}
              variant="secondary"
              size="sm"
              disabled={selected.length === 0 || selected.length > 25}
              onClick={() =>
                void act(runBatch({ caseIds: selected as any, verb, reason: "console batch" }), `Batch ${verb} applied.`)
              }
            >
              {label}
            </Button>
          ))}
          {note ? <span className="text-xs text-text-muted">{note}</span> : null}
        </CardContent>
      </Card>
    </div>
  );
}

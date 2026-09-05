"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results are untyped at the client edge until codegen push */

/**
 * Route: /admin/editorial — SLICE-P4-09 (CAP-041 + CAP-542 + CAP-543) +
 * SLICE-P4-10 decisions (CAP-043 approve · CAP-044 reject · CAP-054
 * schedule · CAP-042 regen). A10 v1 per DECISIONS-LOCKED #10: two-pane
 * layout — draft LEFT, source evidence RIGHT, click-a-claim syncs
 * highlighting; mobile = Draft/Evidence tabs instead of side-by-side.
 * Approve is fail-closed server-side on unconfirmed refs (canApprove is
 * the shared invariant); regen disables at the CAP-042 exhausted state.
 * persona.regenComment (CAP-048) is fenced to Phase 5 (M8 spine).
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { CalendarClock, Check, RefreshCw, Save, X } from "lucide-react";

import { api } from "../../../../../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DatetimePicker } from "@/components/ui/datetime-picker";
import { Input } from "@/components/ui/input";
import { SkeletonText } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toast } from "@/components/ui/toast";

interface QueueRow {
  _id: string;
  status: string;
  postType: string | null;
  title: string;
  overallResult: string | null;
  createdAt: number;
  publishGateFailure?: { reason: string; at: number } | null;
}

const STATUS_TABS = ["review", "drafting", "approved", "scheduled", "published", "rejected", "submitted", "extracting"];

export default function AdminEditorialPage() {
  const [statusFilter, setStatusFilter] = useState<string>("review");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [highlightRefId, setHighlightRefId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftBody, setDraftBody] = useState("");
  const [editingDraft, setEditingDraft] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  // P4-10 decision state
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleValue, setScheduleValue] = useState<string | null>(null);
  const [decisionError, setDecisionError] = useState<string | null>(null);
  const [decisionToast, setDecisionToast] = useState<{ variant: "success" | "error"; message: string } | null>(null);

  const queue = useQuery(api.editorial.review.queueList, { status: statusFilter || undefined });
  const review = useQuery(
    api.editorial.review.candidateReview,
    selectedId ? { candidateId: selectedId as any } : "skip",
  );
  const confirmRef = useMutation(api.editorial.review.confirmClaimRef);
  const editDraft = useMutation(api.editorial.review.editDraft);
  const approveCandidate = useMutation(api.editorial.decisions.candidateApprove);
  const rejectCandidate = useMutation(api.editorial.decisions.candidateReject);
  const scheduleCandidate = useMutation(api.editorial.decisions.candidateSchedule);
  const regenCandidate = useMutation(api.editorial.decisions.candidateRegen);
  const exportDerivative = useMutation(api.editorial.publish.socialExport);

  const runDecision = async (fn: () => Promise<unknown>, successMessage: string) => {
    setDecisionError(null);
    try {
      await fn();
      setDecisionToast({ variant: "success", message: successMessage });
      setRejectOpen(false);
      setScheduleOpen(false);
    } catch (e) {
      setDecisionError((e as Error).message);
    }
  };

  const rows: QueueRow[] = useMemo(() => (queue as any[]) ?? [], [queue]);

  const openCandidate = (id: string) => {
    setSelectedId(id);
    setHighlightRefId(null);
    setEditingDraft(false);
    setEditError(null);
  };

  const beginEdit = () => {
    if (!review?.candidate) return;
    setDraftTitle((review.candidate.draft as any)?.title ?? "");
    setDraftBody((review.candidate.draft as any)?.body ?? "");
    setEditingDraft(true);
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    try {
      await editDraft({ candidateId: selectedId as any, title: draftTitle, body: draftBody });
      setEditingDraft(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Edit failed");
    }
  };

  const queueColumns: DataTableColumn<QueueRow>[] = [
    { key: "title", header: "Candidate", cell: (r) => <span className="text-sm font-medium">{r.title}</span> },
    {
      key: "status",
      header: "Status",
      cell: (r) => (
        <span className="inline-flex items-center gap-1">
          <Badge tone={r.status === "rejected" ? "error" : r.status === "published" ? "success" : "neutral"}>{r.status}</Badge>
          {/* OQ5 outcome: publish-gate failure keeps the candidate scheduled + alerts here */}
          {r.publishGateFailure ? (
            <Badge tone="warning" title={r.publishGateFailure.reason}>publish blocked</Badge>
          ) : null}
        </span>
      ),
    },
    { key: "postType", header: "Type", cell: (r) => <span className="text-xs text-text-muted">{r.postType ?? "—"}</span> },
    {
      key: "overall",
      header: "Qualification",
      cell: (r) =>
        r.overallResult === null ? (
          <span className="text-xs text-text-muted">not run</span>
        ) : (
          <Badge tone={r.overallResult === "pass" ? "success" : "error"}>{r.overallResult}</Badge>
        ),
    },
  ];

  const draftPane = (
    <div className="space-y-3">
      {editingDraft ? (
        <>
          <div className="space-y-1">
            <label htmlFor="ed-title" className="text-xs text-(--text-secondary)">Title</label>
            <Input id="ed-title" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label htmlFor="ed-body" className="text-xs text-(--text-secondary)">Body (markdown, no URLs)</label>
            <textarea
              id="ed-body"
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-(--border-default) bg-(--bg-surface) p-3 font-mono text-sm text-(--text-primary) outline-hidden focus:border-(--border-active)"
            />
          </div>
          {editError ? <Banner variant="error">{editError}</Banner> : null}
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={() => void saveEdit()}>
              <Save className="size-4" />
              Commit edit (resets ALL claim confirmations + re-qualifies)
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setEditingDraft(false)}>Cancel</Button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-(--text-primary)">{(review?.candidate?.draft as any)?.title ?? "(untitled)"}</h2>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed text-(--text-primary)">
            {(review?.candidate?.draft as any)?.body ?? ""}
          </div>
          {review?.candidate?.status === "review" ? (
            <Button variant="secondary" size="sm" onClick={beginEdit}>
              Edit draft (CAP-543)
            </Button>
          ) : null}
        </>
      )}
    </div>
  );

  const evidencePane = (
    <div className="space-y-4">
      {/* Claim-by-claim entailment (CAP-542) — the A10 click-sync target */}
      <section aria-label="Claim citations" className="space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Claim citations ({review?.claimRefs.length ?? 0})</h3>
        {(review?.claimRefs ?? []).map((ref: any) => {
          const highlighted = highlightRefId === ref._id;
          return (
            <div
              key={ref._id}
              id={`ref-${ref._id}`}
              onClick={() => setHighlightRefId(highlighted ? null : ref._id)}
              className={`cursor-pointer rounded-lg border p-3 transition-colors ${highlighted ? "border-(--border-active) bg-(--bg-overlay)" : "border-(--border-subtle) hover:border-(--border-prominent)"}`}
            >
              <p className="text-sm text-(--text-primary)">{ref.assertionText}</p>
              <div className="mt-2 space-y-1">
                {ref.claims.map((c: any, i: number) => (
                  <p key={i} className="border-l-2 border-(--border-prominent) pl-2 text-xs text-(--text-secondary)">
                    <span className="font-medium">{c.claimType}</span> · {c.claimText}
                    <span className="block text-(--text-muted)">evidence: {c.evidenceText}</span>
                  </p>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {Object.entries(ref.exactValidation as Record<string, string>).map(([k, v]) => (
                  <Badge key={k} tone={v === "pass" ? "success" : "error"}>{k}: {v}</Badge>
                ))}
                <Badge tone={ref.operatorConfirmed ? "success" : "warning"}>
                  {ref.operatorConfirmed ? "confirmed" : "unconfirmed"}
                </Badge>
                {review?.candidate?.status === "review" ? (
                  <div className="ml-auto flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Confirm entailment"
                      onClick={() => void confirmRef({ refId: ref._id as any, operatorConfirmed: true })}
                    >
                      <Check className="size-4 text-(--feedback-success)" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label="Reject entailment"
                      onClick={() => void confirmRef({ refId: ref._id as any, operatorConfirmed: false })}
                    >
                      <X className="size-4 text-(--feedback-error)" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </section>

      {/* Rule results (latest live run) */}
      <section aria-label="Qualification results" className="space-y-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Qualification ({review?.latestRun?.overallResult ?? "not run"})</h3>
        {(review?.ruleResults ?? []).map((r: any) => (
          <div key={r._id} className="flex items-center justify-between gap-2 text-xs">
            <span className="font-mono text-(--text-secondary)">{r.ruleKey}</span>
            <span className="flex items-center gap-2">
              <span className="text-(--text-muted)">{r.evidence?.slice(0, 80)}</span>
              <Badge tone={r.result === "pass" ? "success" : r.result === "fail" ? "error" : "warning"}>{r.result}</Badge>
            </span>
          </div>
        ))}
      </section>

      {/* Similarity checks */}
      {((review?.similarityChecks ?? []) as any[]).length > 0 ? (
        <section aria-label="Similarity checks" className="space-y-1">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Similarity</h3>
          {(review?.similarityChecks ?? []).map((s: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-2 text-xs">
              <span className="font-mono text-(--text-secondary)">{s.checkType}</span>
              <span className="flex items-center gap-2">
                <span className="text-(--text-muted)">{s.score?.toFixed(3)} vs {s.threshold}</span>
                <Badge tone={s.result === "pass" ? "success" : "error"}>{s.result}</Badge>
              </span>
            </div>
          ))}
        </section>
      ) : null}
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-(--text-primary)">Editorial Workspace</h1>
        <p className="text-sm text-(--text-secondary)">
          Claims-first candidate review — confirm every claim&apos;s entailment before approval can unlock (server-enforced at P4-10&apos;s approve).
        </p>
      </header>

      {/* Queue: status tabs + table (contract OQ#8's defaulted ordering) */}
      <div className="space-y-2">
        <Tabs value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setSelectedId(null); }}>
          <TabsList>
            {STATUS_TABS.map((s) => (
              <TabsTrigger key={s} value={s}>{s}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value={statusFilter}>
            {queue === undefined ? (
              <SkeletonText className="w-full" />
            ) : (
              <DataTable columns={queueColumns} data={rows} getRowId={(r) => r._id} density="compact" onRowClick={(r) => openCandidate(r._id)} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {review ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
            <div>
              <h2 className="text-sm font-semibold text-(--text-primary)">Candidate review</h2>
              <p className="text-xs text-(--text-muted)">
                {review.candidate.postType ?? "untyped"} · {review.claimRefs.filter((r: any) => r.operatorConfirmed).length}/{review.claimRefs.length} claims confirmed
              </p>
            </div>
            {/* P4-10 decision bar. Approve: CAP-043 — disabled until every
                claim is confirmed (server re-enforces via canApprove).
                Reject: CAP-044 (reason required, modal). Schedule: CAP-054
                (approved candidates, DatetimePicker modal). Regen: CAP-042
                (≤3 attempts, exhausted disables). */}
            <div className="flex flex-wrap items-center gap-2">
              {review.candidate.status === "review" && (
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!review.approveGate}
                  title={review.approveGate ? "Approve (CAP-043 gates re-checked server-side)" : "Approve is fail-closed until every claim is confirmed (CAP-043)"}
                  onClick={() => selectedId && runDecision(() => approveCandidate({ candidateId: selectedId as any }), "Candidate approved")}
                >
                  <Check className="size-4" /> Approve
                </Button>
              )}
              {(review.candidate.status === "review" || review.candidate.status === "drafting") && (
                <>
                  <Button
                    variant="destructive"
                    size="sm"
                    title="Reject — terminal for this revision; reason is the retained record (CAP-044)"
                    onClick={() => { setRejectReason(""); setRejectOpen(true); }}
                  >
                    <X className="size-4" /> Reject
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={review.regen?.exhausted}
                    title={review.regen?.exhausted
                      ? `Regen exhausted — ${review.regen.attemptsUsed}/${review.regen.attemptsMax} GLM attempts (CAP-042)`
                      : `Regen draft via GLM (${review.regen?.attemptsUsed ?? 0}/${review.regen?.attemptsMax ?? 3} attempts used)`}
                    onClick={() => selectedId && runDecision(() => regenCandidate({ candidateId: selectedId as any }), "Regen scheduled — new draft will appear in the queue")}
                  >
                    <RefreshCw className="size-4" /> Regen
                  </Button>
                </>
              )}
              {review.candidate.status === "approved" && (
                <Button
                  variant="primary"
                  size="sm"
                  title="Schedule publish at a fire-time (CAP-054)"
                  onClick={() => { setScheduleValue(null); setScheduleOpen(true); }}
                >
                  <CalendarClock className="size-4" /> Schedule
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {review.publishGateFailure ? (
              <div className="mb-3">
                <Banner variant="warning">
                  Publish gate blocked this candidate (it stays scheduled): {review.publishGateFailure.reason}. Fix and re-approve, or reject.
                </Banner>
              </div>
            ) : null}
            {decisionError ? <div className="mb-3"><Banner variant="error">{decisionError}</Banner></div> : null}
            {decisionToast ? (
              <div className="mb-3">
                <Toast variant={decisionToast.variant} message={decisionToast.message} onDismiss={() => setDecisionToast(null)} />
              </div>
            ) : null}
            {/* A10 v1 (DECISIONS-LOCKED #10): two-pane desktop, tabs on mobile */}
            <div className="hidden gap-6 lg:grid lg:grid-cols-2">
              <div>{draftPane}</div>
              <div>{evidencePane}</div>
            </div>
            <Tabs defaultValue="draft" className="lg:hidden">
              <TabsList>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="evidence">Evidence</TabsTrigger>
              </TabsList>
              <TabsContent value="draft">{draftPane}</TabsContent>
              <TabsContent value="evidence">{evidencePane}</TabsContent>
            </Tabs>
            <p className="mt-4 text-xs text-(--text-muted)">
              Click a claim to highlight it (A10 sync). Source links: {(review.candidateSources ?? []).length} ·
              conflicts surface via H-SRC rule evidence.
            </p>
            {/* States G — social derivatives for published candidates (CAP-052/053,
                export-only per DEC-O07: copy + mark exported, never auto-posted) */}
            {(review.derivatives ?? []).length > 0 ? (
              <div className="mt-4 space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-(--text-muted)">Social derivatives (export-only)</h3>
                {(review.derivatives as any[]).map((d) => (
                  <div key={d._id} className="flex items-start justify-between gap-3 rounded-lg border border-(--border-default) p-3">
                    <div className="min-w-0">
                      <Badge tone={d.status === "exported" ? "success" : "neutral"}>{d.derivativeType}</Badge>
                      <p className="mt-1 line-clamp-3 text-xs text-(--text-secondary)">{d.content}</p>
                    </div>
                    {d.status !== "exported" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Copy to clipboard + mark exported (never auto-posted — DEC-O07)"
                        onClick={() =>
                          void runDecision(async () => {
                            const res = await exportDerivative({ derivativeId: d._id });
                            await navigator.clipboard?.writeText(res.content);
                          }, "Derivative copied + marked exported")
                        }
                      >
                        Copy &amp; mark exported
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : selectedId ? (
        <SkeletonText className="w-full" />
      ) : null}

      {/* CAP-044 reject modal — reason required; the retained legal-audit record */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject candidate</DialogTitle>
            <DialogDescription>
              Terminal for this revision; records are preserved. The reason is the candidate&apos;s retained
              legal-audit record (CAP-044) — required, non-deletable.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Why is this candidate rejected?"
            className="w-full rounded-lg border border-(--border-default) bg-(--bg-surface) p-3 text-sm text-(--text-primary) outline-hidden focus:border-(--border-active)"
          />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={!rejectReason.trim()}
              onClick={() => selectedId && void runDecision(
                () => rejectCandidate({ candidateId: selectedId as any, rejectionReason: rejectReason }),
                "Candidate rejected",
              )}
            >
              Reject candidate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CAP-054 schedule modal — fire-time via the §11.14 picker */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule publish</DialogTitle>
            <DialogDescription>
              The candidate flips to <em>scheduled</em> and publishes at the fire-time (CAP-054). No audit row is
              written for scheduling — register-faithful.
            </DialogDescription>
          </DialogHeader>
          <DatetimePicker value={scheduleValue} onChange={setScheduleValue} withTime />
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!scheduleValue}
              onClick={() => selectedId && scheduleValue && void runDecision(
                () => scheduleCandidate({ candidateId: selectedId as any, fireAt: Date.parse(scheduleValue) }),
                "Candidate scheduled",
              )}
            >
              Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

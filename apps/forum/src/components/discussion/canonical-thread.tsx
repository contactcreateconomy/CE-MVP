/* eslint-disable @typescript-eslint/no-explicit-any -- Convex api Id boundary casts */
"use client";

/**
 * CanonicalThread — SLICE-P5-03 (CAP-123/124/125/126/127/128/131): the M6
 * thread on /discussions/[slug]. Sort tabs (six, cursor-frozen pages),
 * comment cards (AI badge, tombstones, edited markers), reply groups,
 * compose (comments.create), valuable/save/negative(+private reason)/
 * context-signal affordances, read-state marking.
 *
 * Anonymous-safe: reads render without viewer state; write affordances
 * prompt sign-in. The MAX panel area renders an honest empty state until
 * Phase 7 (CAP-132/133).
 */

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

const SORT_LABELS: Record<string, string> = {
  best: "Best",
  live: "Live",
  new: "New",
  top: "Top",
  most_discussed: "Most discussed",
  qa: "Q&A",
};

const INTENT_LABELS: Record<string, string> = {
  question: "Question",
  answer: "Answer",
  evidence: "Evidence",
  counterpoint: "Counterpoint",
  experience: "Experience",
};

const NEGATIVE_REASONS = ["disagree", "not_useful", "needs_evidence", "off_topic"] as const;

interface CommentCard {
  id: string;
  depth: number;
  authorName: string | null;
  aiBadged: boolean;
  body: string | null;
  tombstone: boolean;
  authorIntent: string | null;
  editedAt: number | null;
  createdAt: number;
  counts: { valuable: number; replies: number; saves: number };
  viewer: { reacted: string | null; saved: boolean } | null;
}

export function CanonicalThread({ postId, archived }: { postId: string; archived: boolean }) {
  const configured = isConvexConfigured();
  const thread = useQuery(
    api.comments.reads.getThread,
    configured && postId ? ({ postId: postId as any } as any) : "skip",
  );
  const [sortMode, setSortMode] = useState<string>("best");
  const [pages, setPages] = useState<CommentCard[][]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const listPage = useQuery(
    api.comments.reads.list,
    configured && postId
      ? ({ postId: postId as any, sortMode: sortMode as any, cursor: cursor ?? undefined, limit: 20 } as any)
      : "skip",
  );

  // sort/host change resets the walk; cursor advance appends the next page
  useEffect(() => {
    setPages([]);
    setCursor(null);
  }, [sortMode, postId]);

  useEffect(() => {
    if (!listPage) return;
    setPages((prev) => (cursor === null ? [listPage.page] : [...prev, listPage.page]));
    setLoadingMore(false);
  }, [listPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const comments = useMemo(() => pages.flat(), [pages]);

  if (!configured) return null;
  if (thread === undefined) {
    return (
      <section className="rounded-lg border border-(--border-default) p-6">
        <div className="h-4 w-40 animate-pulse rounded bg-(--bg-overlay)" />
      </section>
    );
  }
  if (thread === null) return null; // non-published — nothing to render

  const stats = thread.stats;
  return (
    <section className="space-y-4" aria-label="Discussion thread">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-(--text-primary)">
          Discussion{" "}
          <span className="text-sm font-normal text-(--text-muted)">
            ({stats.humanCommentCount} member{stats.humanCommentCount === 1 ? "" : "s"}’{" "}
            {stats.humanCommentCount + stats.personaCommentCount} comment
            {stats.humanCommentCount + stats.personaCommentCount === 1 ? "" : "s"})
          </span>
        </h2>
        <div className="flex flex-wrap gap-1" role="tablist" aria-label="Sort mode">
          {(thread.allowedSortModes as string[]).map((mode) => (
            <button
              key={mode}
              role="tab"
              aria-selected={sortMode === mode}
              onClick={() => setSortMode(mode)}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                sortMode === mode
                  ? "bg-brand-primary/10 text-brand-primary"
                  : "bg-bg-overlay text-text-secondary hover:text-text-primary"
              }`}
            >
              {SORT_LABELS[mode] ?? mode}
            </button>
          ))}
        </div>
      </header>

      {/* MAX panel — honest empty until Phase 7 (CAP-132/133) */}
      <div className="rounded-lg border border-dashed border-(--border-default) px-4 py-2 text-xs text-(--text-muted)">
        Thread intelligence (themes · positions · Q&amp;A map) renders when the MAX pass ships (Phase 7).
      </div>

      {archived ? null : <ComposeBox postId={postId} />}

      {comments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-sm text-(--text-muted)">
            No comments yet{archived ? " (thread preserved)." : " — start the discussion."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {comments.map((c) => (
            <CommentRow key={c.id} comment={c} postId={postId} accepted={thread.help?.acceptedCommentId === c.id} />
          ))}
        </ul>
      )}

      {listPage?.cursor ? (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              setCursor(listPage.cursor!);
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function CommentRow({ comment, postId, accepted }: { comment: CommentCard; postId: string; accepted: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const valuable = useMutation(api.reactions.toggleValuable);
  const negative = useMutation(api.reactions.toggleNegative);
  const save = useMutation(api.reactions.toggleSave);
  const signal = useMutation(api.reactions.signalContext);
  const markRead = useMutation(api.reactions.markReadState);
  const { authStatus } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const replies = useQuery(
    api.comments.reads.listReplies,
    expanded ? ({ threadRootCommentId: comment.id as any, limit: 50 } as any) : "skip",
  );

  useEffect(() => {
    if (authStatus === "authenticated") {
      void markRead({ postId: postId as any, lastReadCommentId: comment.id as any }).catch(() => {});
    }
  }, [comment.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <li className="rounded-lg border border-(--border-default) bg-(--bg-surface) p-4">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-medium text-(--text-primary)">{comment.authorName ?? "Member"}</span>
        {comment.aiBadged ? <Badge tone="info">AI</Badge> : null}
        {accepted ? <Badge tone="success">Accepted</Badge> : null}
        {comment.authorIntent ? <Badge tone="neutral">{INTENT_LABELS[comment.authorIntent] ?? comment.authorIntent}</Badge> : null}
        {comment.editedAt ? <span className="text-xs text-(--text-muted)">edited</span> : null}
        <span className="ml-auto text-xs text-(--text-muted)">{new Date(comment.createdAt).toLocaleDateString()}</span>
      </div>

      {comment.tombstone ? (
        <p className="mt-2 text-sm italic text-(--text-muted)">This comment was removed. Replies are preserved.</p>
      ) : (
        <p className="mt-2 whitespace-pre-wrap text-sm text-(--text-secondary)">{comment.body}</p>
      )}

      {err ? <p className="mt-2 text-xs text-(--feedback-error, #b91c1c)">{err}</p> : null}

      {!comment.tombstone ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {authStatus === "authenticated" ? (
            <>
              <Button
                variant="ghost" size="sm" disabled={busy}
                onClick={() => void act(() => valuable({ commentId: comment.id as any }))}
                aria-pressed={comment.viewer?.reacted === "valuable"}
              >
                ▲ Valuable ({comment.counts.valuable})
              </Button>
              <Button
                variant="ghost" size="sm" disabled={busy}
                onClick={() => void act(() => save({ commentId: comment.id as any }))}
                aria-pressed={Boolean(comment.viewer?.saved)}
              >
                {comment.viewer?.saved ? "Saved ✓" : "Save"}
              </Button>
              <ReasonMenu disabled={busy} onPick={(reason) => void act(() => negative({ commentId: comment.id as any, reason: reason as any }))} />
              <Button
                variant="ghost" size="sm" disabled={busy}
                onClick={() => void act(() => signal({ commentId: comment.id as any, signalType: "context_needed" }))}
              >
                Needs context
              </Button>
              {comment.depth === 0 ? (
                <Button variant="ghost" size="sm" disabled={busy} onClick={() => setExpanded((v) => !v)}>
                  {expanded ? "Hide replies" : `Replies (${comment.counts.replies})`}
                </Button>
              ) : null}
            </>
          ) : (
            <span className="text-(--text-muted)">Sign in to react, save, or reply.</span>
          )}
        </div>
      ) : null}

      {expanded && replies ? (
        <ul className="mt-3 space-y-2 border-l-2 border-(--border-default) pl-4">
          {replies.page.length === 0 ? (
            <li className="text-xs text-(--text-muted)">No replies.</li>
          ) : (
            replies.page.map((r: CommentCard) => (
              <li key={r.id} className="text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-(--text-primary)">{r.authorName ?? "Member"}</span>
                  {r.aiBadged ? <Badge tone="info">AI</Badge> : null}
                </div>
                <p className="mt-1 whitespace-pre-wrap text-(--text-secondary)">{r.body}</p>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </li>
  );
}

/** §11.7 dropdown analog for the PRIVATE negative reason (CAP-128). */
function ReasonMenu({ disabled, onPick }: { disabled: boolean; onPick: (reason: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <Button variant="ghost" size="sm" disabled={disabled} onClick={() => setOpen((v) => !v)}>
        ▼ Flag
      </Button>
      {open ? (
        <span className="absolute left-0 z-10 mt-1 flex w-44 flex-col rounded-md border border-(--border-default) bg-(--bg-surface-elevated) p-1 shadow-lg">
          {NEGATIVE_REASONS.map((reason) => (
            <button
              key={reason}
              className="cursor-pointer rounded px-2 py-1 text-left text-xs text-(--text-secondary) hover:bg-(--bg-overlay)"
              onClick={() => {
                setOpen(false);
                onPick(reason);
              }}
            >
              {reason.replace(/_/g, " ")}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

/** The compose box — CAP-120 surface (authorIntent self-labeling, OQ#7:
 *  the composer is where the member self-labels — flagged). */
function ComposeBox({ postId, parent }: { postId: string; parent?: CommentCard }) {
  const { authStatus } = useAuth();
  const create = useMutation(api.comments.create);
  const [body, setBody] = useState("");
  const [intent, setIntent] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (authStatus !== "authenticated") {
    return (
      <Card>
        <CardContent className="py-4 text-center text-sm text-(--text-muted)">
          <a href="/signin" className="underline">Sign in</a> to join the discussion.
        </CardContent>
      </Card>
    );
  }

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      await create({
        postId: postId as any,
        parentCommentId: parent ? (parent.id as any) : undefined,
        body,
        authorIntent: intent ? (intent as any) : undefined,
      });
      setBody("");
      setIntent("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-2 py-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={parent ? `Reply to ${parent.authorName ?? "member"}…` : "Add to the discussion (no URLs)"}
          rows={3}
          maxLength={10000}
          className="w-full rounded-md border border-(--border-default) bg-(--bg-surface) p-2 text-sm text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-1 focus:ring-(--brand-primary)"
        />
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            className="rounded-md border border-(--border-default) bg-(--bg-surface) px-2 py-1 text-xs text-(--text-secondary)"
            aria-label="Label your comment (optional)"
          >
            <option value="">No label</option>
            {Object.entries(INTENT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button size="sm" disabled={busy || body.trim().length === 0} onClick={() => void submit()}>
            {busy ? "Posting…" : parent ? "Reply" : "Comment"}
          </Button>
          {err ? <span className="text-xs text-(--feedback-error, #b91c1c)">{err}</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}

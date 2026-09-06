/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results untyped at the client edge */
"use client";

/**
 * CanonicalFeedClient — SLICE-P6-03 (CAP-182…186/194/198…201/553): the
 * canonical /feed over postDistributionScores + cardSummaries. Four sorts
 * (anonymous lands on Hot — quoted), type nav from postTypeConfig (locked
 * types hidden), hero band + Featured (labeled) + Vibing list (A7 degrade)
 * + Podium ("forming" until M12), snapshot pagination, per-card why-drawer
 * + hide/mute/report + unhide. The legacy demo feed is retired from this
 * route (00-TRANSITION: canonical replaces; demo data disposable).
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";
import { useAuth } from "@cemvp/auth-ui";

type SortMode = "hot" | "top" | "new" | "fav";

const SORT_LABELS: Record<SortMode, string> = { hot: "Hot", top: "Top", new: "New", fav: "Fav" };

export function CanonicalFeedClient() {
  const configured = isConvexConfigured();
  const { authStatus } = useAuth();
  const member = authStatus === "authenticated";
  // CAP-183 (quoted): "Anonymous lands on Hot."
  const [sort, setSort] = useState<SortMode>("hot");
  const effectiveSort = sort === "fav" && !member ? "hot" : sort;
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [pages, setPages] = useState<any[][]>([]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());

  const chrome = useQuery(api.feed.getChrome, configured ? {} : "skip");
  const page = useQuery(
    api.feed.list,
    configured ? ({ sortMode: effectiveSort, typeFilter: typeFilter ?? undefined, cursor } as any) : "skip",
  );

  const why = useMutation(api.feed.getWhy as any); // drawer uses the query form below
  void why;
  const cardAction = useMutation(api.feed.cardAction);
  const unhide = useMutation(api.feed.unhide);

  useEffect1(page, cursor, setPages, setLoadingMore);
  const cards = useMemo(() => pages.flat().filter((c) => !hiddenIds.has(c.postId)), [pages, hiddenIds]);

  if (!configured) return null;

  return (
    <section className="space-y-5" aria-label="Feed">
      {/* Hero band (4–6; labeled; Community Top auto-fills are marked) */}
      {chrome?.hero?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {chrome.hero.map((h: any) => (
            <a key={h.postId} href={`/discussions/${h.postId}`} className="card-surface rounded-xl border border-(--border-subtle) p-4 transition-colors hover:border-(--border-prominent)">
              <div className="flex items-center gap-2">
                <Badge tone="brand">{h.isCommunityTop ? "Community Top" : "Featured"}</Badge>
                <span className="text-xs text-(--text-muted)">{h.disclosureClass}</span>
              </div>
              <h3 className="mt-2 text-base font-semibold text-(--text-primary)">{h.title}</h3>
            </a>
          ))}
        </div>
      ) : null}

      {/* Vibing (A7 degrade: labeled list) + Featured frames + Podium */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardContent className="space-y-1 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">What&apos;s Vibing</h2>
            {chrome?.vibing?.length ? (
              <ul className="space-y-1 text-sm">
                {chrome.vibing.map((v: any) => (
                  <li key={`${v.objectType}:${v.objectId}`} className="flex items-baseline justify-between gap-2">
                    <span className="text-(--text-secondary)">{v.hook ?? "Trending now"}</span>
                    <span className="text-xs text-(--text-muted)">{v.humans} people</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-(--text-muted)">Nothing vibing yet.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Featured</h2>
            {chrome?.featured?.length ? (
              <ul className="space-y-1 text-sm">
                {chrome.featured.map((f: any) => (
                  <li key={f.postId}>
                    <a href={`/discussions/${f.postId}`} className="text-(--text-secondary) underline-offset-2 hover:underline">
                      {f.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-(--text-muted)">No featured slots active.</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-1 py-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">Podium</h2>
            {chrome?.podium?.forming ? (
              <p className="text-sm text-(--text-muted)">Podium is forming — recognition opens with the community.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {(chrome?.podium?.entries ?? []).map((e: any) => (
                  <li key={e.userId} className="text-(--text-secondary)">#{e.rank} · {e.points} pts</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sorts + type nav */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1" role="tablist" aria-label="Sort mode">
          {(["hot", "top", "new", ...(member ? (["fav"] as SortMode[]) : [])] as SortMode[]).map((mode) => (
            <button
              key={mode}
              role="tab"
              aria-selected={effectiveSort === mode}
              onClick={() => {
                setSort(mode);
                setPages([]);
                setCursor(undefined);
              }}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                effectiveSort === mode ? "bg-brand-primary/10 text-brand-primary" : "bg-bg-overlay text-text-secondary hover:text-text-primary"
              }`}
            >
              {SORT_LABELS[mode]}
            </button>
          ))}
        </div>
        <span className="mx-1 h-5 w-px bg-(--border-default)" aria-hidden />
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => setTypeFilter(null)}
            className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ${typeFilter === null ? "bg-bg-overlay text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
          >
            All
          </button>
          {(chrome?.typeNav ?? []).map((t: any) => (
            <button
              key={t.type}
              onClick={() => {
                setTypeFilter(t.type);
                setPages([]);
                setCursor(undefined);
              }}
              className={`cursor-pointer rounded-full px-2.5 py-1 text-xs font-medium ${typeFilter === t.type ? "bg-bg-overlay text-text-primary" : "text-text-muted hover:text-text-secondary"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {page === undefined && pages.length === 0 ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-(--border-default) border-t-(--brand-primary)" />
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-(--text-muted)">
            {effectiveSort === "fav"
              ? "Nothing saved yet — save posts and comments and they collect here."
              : "The feed is forming. Member posts appear here the moment they publish."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => (
            <FeedCard
              key={card.postId}
              card={card}
              member={member}
              onHidden={(id) => setHiddenIds((prev) => new Set([...prev, id]))}
              cardAction={cardAction}
            />
          ))}
        </ul>
      )}

      {page?.cursor != null ? (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            disabled={loadingMore}
            onClick={() => {
              setLoadingMore(true);
              setCursor(page.cursor!);
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}

      {/* CAP-553 surface: undo hides */}
      {hiddenIds.size > 0 ? (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              for (const id of hiddenIds) void unhide({ postId: id as any });
              setHiddenIds(new Set());
            }}
          >
            Unhide {hiddenIds.size} hidden item{hiddenIds.size === 1 ? "" : "s"} (CAP-553)
          </Button>
        </div>
      ) : null}
    </section>
  );
}

function FeedCard({
  card,
  member,
  onHidden,
  cardAction,
}: {
  card: any;
  member: boolean;
  onHidden: (id: string) => void;
  cardAction: any;
}) {
  const [whyOpen, setWhyOpen] = useState(false);
  const why = useQuery(api.feed.getWhy, whyOpen && member ? ({ postId: card.postId as any } as any) : "skip");
  const [busy, setBusy] = useState(false);

  return (
    <li>
      <Card>
        <CardContent className="space-y-2 py-4">
          <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
            <Badge tone="neutral">{card.type}</Badge>
            {card.rising ? <Badge tone="warning">Rising</Badge> : null}
            <span>{card.authorName}</span>
            <span>· {new Date(card.publishedAt).toLocaleDateString()}</span>
            <span className="ml-auto flex gap-2">
              {card.discussingCount > 0 ? <span>{card.discussingCount} discussing</span> : null}
            </span>
          </div>
          <a href={`/discussions/${card.postId}`} className="block text-base font-semibold text-(--text-primary) underline-offset-2 hover:underline">
            {card.title}
          </a>
          <p className="text-sm text-(--text-secondary)">{card.oneLiner}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-(--text-muted)">
            <span>▲ {card.engagement.valuable}</span>
            <span>💬 {card.engagement.replies}</span>
            <span>🔖 {card.engagement.saves}</span>
            {member ? (
              <>
                <button className="cursor-pointer hover:text-text-primary" onClick={() => setWhyOpen((v) => !v)}>
                  Why this?
                </button>
                <button
                  className="cursor-pointer hover:text-text-primary"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    cardAction({ postId: card.postId, action: "hide" })
                      .then(() => onHidden(card.postId))
                      .finally(() => setBusy(false));
                  }}
                >
                  Hide
                </button>
                <button
                  className="cursor-pointer hover:text-text-primary"
                  disabled={busy}
                  onClick={() => {
                    setBusy(true);
                    cardAction({ postId: card.postId, action: "report", reasonCode: "member_report" }).finally(() => setBusy(false));
                  }}
                >
                  Report
                </button>
              </>
            ) : null}
          </div>
          {whyOpen ? (
            why ? (
              <div className="rounded-md bg-(--bg-overlay) p-3 text-xs text-(--text-secondary)">
                <p>Top score {why.topScore?.toFixed(2)} · Hot {why.hotScore?.toFixed(2)} — from {why.engagement?.distinctCommenters ?? 0} distinct commenters, {why.engagement?.valuable ?? 0} valuable marks.</p>
                {why.exploration ? <p className="mt-1">Exploration: {why.exploration.injected} insertions (exposure deficit {why.exploration.deficit}).</p> : null}
              </div>
            ) : (
              <p className="text-xs text-(--text-muted)">Loading…</p>
            )
          ) : null}
        </CardContent>
      </Card>
    </li>
  );
}

/** Page-accumulation effect (cursor walk; sort/type resets clear it). */
import { useEffect } from "react";
function useEffect1(page: any, cursor: number | undefined, setPages: any, setLoadingMore: any) {
  useEffect(() => {
    if (!page) return;
    setPages((prev: any[]) => (cursor === undefined ? [page.page] : [...prev, page.page]));
    setLoadingMore(false);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
}

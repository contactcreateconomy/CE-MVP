"use client";

/**
 * Tool Profile client (SLICE-P4-04 + the rating-form closure): CAP-110's
 * TWO labeled segments (R-VERDICT: community aggregate vs editorialVerdicts
 * — conflation prohibited), honest zero-state when ratingCount=0, CAP-119
 * archived banner + frozen aggregate, the CONTRACT-2 States 4–9 rating
 * form (submit/edit/withdraw — P4-05 mutations, closed 2026-09-12), and
 * ratingsPage Load-more continuation.
 *
 * Segment composition note: no §11 primitive exists for two-segment layouts
 * (contract §6 flag) — composed from Card with explicit segment labels.
 */

import { useState } from "react";
import { useConvex, useQuery } from "convex/react";
import { Archive, ExternalLink, PackageSearch, Star } from "lucide-react";
import { useAuth } from "@cemvp/auth-ui";

import { Badge } from "@/components/ui/badge";
import { Banner } from "@/components/ui/banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/convex";
import { ProvenanceFooter } from "@/components/trust/provenance-footer";
import { RatingForm } from "./rating-form";

const DIMENSION_LABELS: Record<string, string> = {
  ease_of_use: "Ease of use",
  output_quality: "Output quality",
  reliability: "Reliability",
  value_for_money: "Value for money",
};

interface ToolProfileClientProps {
  slug: string;
}

export function ToolProfileClient({ slug }: ToolProfileClientProps) {
  // v.any() fields surface as unknown through the regenerated api types —
  // cast at the boundary (page-local idiom)
  // regenerated api types surface v.any() as unknown — boundary cast
  const profile = useQuery(api.tools.getProfile, { slug }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  const { authStatus } = useAuth();
  const convex = useConvex();

  // ratingsPage continuation (contract Action 5) — appended pages held in
  // ratingsPage continuation (contract Action 5) — appended pages held in
  // local state; the base query keeps rendering the first page. Hooks live
  // before the early returns (React rules of hooks).
  const [extraPages, setExtraPages] = useState<{ items: any[]; nextCursor: string | null }[]>([]); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loadingMore, setLoadingMore] = useState(false);

  if (profile === undefined) {
    return (
      <div className="mx-auto w-full max-w-[720px] space-y-4 px-4 py-8 md:px-6" aria-busy>
        <Skeleton className="h-10 w-2/3 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  if (profile === null) {
    return (
      <div className="mx-auto w-full max-w-[720px] px-4 py-8 md:px-6">
        <EmptyState
          icon={<PackageSearch className="size-8" aria-hidden />}
          heading="Tool not found"
          description="No tool in the registry matches this address."
        />
      </div>
    );
  }

  const { tool, aggregate, editorialVerdicts, ratingsPage, myRating } = profile;

  // The first page's cursor comes from getProfile; each Load-more appends
  // one continuation page and advances the cursor.
  const effectiveCursor = extraPages.length > 0
    ? extraPages[extraPages.length - 1].nextCursor
    : ratingsPage.nextCursor;
  const canContinue = effectiveCursor !== null && effectiveCursor !== undefined;

  async function loadMore() {
    if (!canContinue || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await convex.query(api.tools.listRatings, {
        toolId: tool._id,
        cursor: effectiveCursor ?? undefined,
      });
      setExtraPages((prev) => [...prev, { items: page.items, nextCursor: page.nextCursor }]);
    } finally {
      setLoadingMore(false);
    }
  }

  const allRatings = [...ratingsPage.items, ...extraPages.flatMap((p) => p.items)];

  return (
    <div className="mx-auto w-full max-w-[720px] space-y-6 px-4 py-8 md:px-6">
      {tool.status === "archived" ? (
        <Banner variant="warning">
          <span className="inline-flex items-center gap-2">
            <Archive className="size-4" aria-hidden />
            Archived — the community aggregate is frozen and this tool is no longer rated.
          </span>
        </Banner>
      ) : null}

      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-(--text-primary)">{tool.name}</h1>
          {tool.pricing ? <Badge tone="neutral">{String(tool.pricing)}</Badge> : null}
        </div>
        <a
          href={tool.officialUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-(--brand-primary) underline underline-offset-2"
        >
          Official site
          <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </header>

      {/* Labeled segment 1 — COMMUNITY AGGREGATE (from the tools row;
          never includes editorial verdicts — R-VERDICT) */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">
            Community aggregate
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {aggregate.ratingCount === 0 ? (
            <p className="flex items-center gap-2 text-sm text-(--text-secondary)">
              <Star className="size-4 text-(--text-muted)" aria-hidden />
              No member ratings yet — the community score appears once verified members rate this
              tool.
            </p>
          ) : (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-(--text-primary)">{aggregate.overall}</span>
                <span className="text-sm text-(--text-muted)">
                  / 5 · {aggregate.ratingCount} member {aggregate.ratingCount === 1 ? "rating" : "ratings"}
                </span>
              </div>
              <dl className="space-y-1.5">
                {Object.entries(aggregate.dimensions).map(([dim, d]: [string, any]) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <div key={dim} className="flex items-center justify-between gap-4 text-sm">
                    <dt className="text-(--text-secondary)">{DIMENSION_LABELS[dim] ?? dim}</dt>
                    <dd className="text-(--text-primary)">
                      {d.avg === null ? "—" : `${d.avg} / 5`}
                      <span className="ml-1.5 text-xs text-(--text-muted)">({d.count})</span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Labeled segment 2 — EDITORIAL VERDICT (tools editorialVerdict*
          fields, CAP-535 write target; display-only, never aggregated) */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">
            Editorial verdict
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {editorialVerdicts === null ? (
            <p className="text-sm text-(--text-secondary)">
              No editorial verdict yet — editors publish curated verdicts separately from the
              community score.
            </p>
          ) : (
            <div className="space-y-1">
              {editorialVerdicts.score !== null ? (
                <p className="text-lg font-semibold text-(--text-primary)">
                  {editorialVerdicts.score} / 5
                </p>
              ) : null}
              {editorialVerdicts.summary !== null ? (
                <p className="text-sm leading-relaxed text-(--text-secondary)">
                  {editorialVerdicts.summary}
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rating form — CONTRACT-2 States 4–9 (submit/edit/withdraw).
          Eligibility is server-enforced (reject, not UI-hide): the form
          renders for signed-in members and surfaces R-STAFF/R-ONE/verify
          rejections verbatim from the mutations. */}
      {authStatus === "authenticated" ? (
        <RatingForm
          toolId={String(tool._id)}
          toolStatus={String(tool.status)}
          myRating={myRating ?? null}
        />
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-(--text-secondary)">
              <a href="/signin" className="underline">Sign in</a> to rate this tool — ratings are
              open to verified members.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Member ratings + Load-more continuation (contract Action 5) */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-(--text-muted)">
            Member ratings
          </h2>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {allRatings.length === 0 ? (
            <p className="text-sm text-(--text-secondary)">
              {/* Anonymous branch (bible l.33): ratings withheld — member
                  branch with no ratings renders the plain zero-state. */}
              {authStatus !== "authenticated"
                ? "Sign in to see member ratings."
                : "No member ratings yet."}
            </p>
          ) : (
            <>
              <ul className="space-y-3">
                {allRatings.map((r: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                  <li key={i} className="border-b border-(--border-subtle) pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <Badge tone="brand">{r.overallScore} / 5</Badge>
                    </div>
                    {r.reviewText ? (
                      <p className="mt-1.5 text-sm leading-relaxed text-(--text-secondary)">{r.reviewText}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
              {canContinue && (
                <div className="mt-3">
                  <Button variant="secondary" disabled={loadingMore} onClick={loadMore}>
                    {loadingMore ? "Loading…" : "Load more ratings"}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* SLICE-P7T-11 (CAP-468): provenance + trust footer on tool hosts */}
      <ProvenanceFooter />
    </div>
  );
}

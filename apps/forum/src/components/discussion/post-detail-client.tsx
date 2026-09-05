"use client";

/* eslint-disable @typescript-eslint/no-explicit-any -- Convex query results are untyped at the client edge */

/**
 * PostDetailClient — SLICE-P4-13 (CAP-090/092/106/107 render side).
 * The canonical typed-post reading column (§4.3 max 720px): per-type blocks,
 * CAP-092 live-computed compare grid (count 0 → "—", nothing stored), the
 * CAP-049 structured affiliate CTA (rel="sponsored nofollow noopener",
 * never prose), and the CAP-089 tombstone. Mechanic affordances (debate
 * cast, list votes — P4-14) and help/showcase actions (P4-15) land next;
 * this slice renders their state read-only. The thread itself (comments)
 * arrives with the M6 discussion engine (Phase 5) — honest empty state.
 */

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const TYPE_LABELS: Record<string, string> = {
  news: "News", review: "Review", compare: "Compare", spark: "Spark",
  debate: "Debate", list: "List", showcase: "Showcase", help: "Help",
};

const DIMENSION_LABELS: Record<string, string> = {
  ease_of_use: "Ease of use", output_quality: "Output quality",
  reliability: "Reliability", value_for_money: "Value for money",
};

function fmtDate(ms: number | null): string {
  return ms ? new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
}

function CompareGrid({ rows }: { rows: any[] }) {
  if (rows.length < 2 || rows.length > 4) {
    return <p className="text-sm text-(--text-muted)">Compare needs 2–4 tools (CAP-092).</p>;
  }
  const dims = Object.keys(DIMENSION_LABELS);
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-(--border-default) text-left text-xs uppercase tracking-wide text-(--text-muted)">
            <th className="py-2 pr-3 font-medium">Tool</th>
            <th className="py-2 pr-3 font-medium">Overall</th>
            {dims.map((d) => <th key={d} className="py-2 pr-3 font-medium">{DIMENSION_LABELS[d]}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.toolId} className="border-b border-(--border-subtle) last:border-b-0">
              <td className="py-2 pr-3 font-medium text-(--text-primary)">{r.name}</td>
              <td className="py-2 pr-3 text-(--text-primary)">{r.overall === null ? "—" : `${r.overall.toFixed(1)} (${r.ratingCount})`}</td>
              {dims.map((d) => (
                <td key={d} className="py-2 pr-3 text-(--text-secondary)">
                  {r.dimensions?.[d]?.avg === null || r.dimensions?.[d]?.avg === undefined ? "—" : r.dimensions[d].avg.toFixed(1)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-(--text-muted)">Live-computed from the community aggregate — never stored (CAP-092).</p>
    </div>
  );
}

export function PostDetailClient({ detail }: { detail: any }) {
  const { post, extension, threadContext, compare, affiliateCtas } = detail;
  const mechanic = threadContext?.mechanic;

  if (post.archived) {
    // CAP-089 tombstone — the thread is preserved underneath (Phase 5)
    return (
      <article className="mx-auto max-w-(--container-reading) space-y-2 py-8">
        <Badge tone="neutral">{TYPE_LABELS[post.type] ?? post.type}</Badge>
        <h1 className="text-xl font-semibold text-(--text-muted)">This post was removed by its author</h1>
        <p className="text-sm text-(--text-muted)">The discussion it carried is preserved. (CAP-089 tombstone)</p>
      </article>
    );
  }

  return (
    <article className="mx-auto max-w-(--container-reading) space-y-6 py-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge tone="neutral">{TYPE_LABELS[post.type] ?? post.type}</Badge>
          {post.authorType === "editorial" ? (
            <span className="text-xs text-(--text-muted)">
              Createconomy Editorial{post.editorialByline ? ` · ${post.editorialByline}` : ""}
            </span>
          ) : null}
          <span className="text-xs text-(--text-muted)">{fmtDate(post.publishedAt)}</span>
        </div>
        <h1 className="text-2xl font-semibold text-(--text-primary)">{post.title}</h1>
      </header>

      <div className="space-y-4 text-base leading-relaxed text-(--text-secondary)">
        {String(post.body).split(/\n{2,}/).map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>

      {/* Per-type blocks */}
      {post.type === "news" && extension ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h2 className="text-sm font-semibold text-(--text-primary)">Source of truth</h2>
            <a
              href={extension.sourceOfTruthUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-(--text-accent) underline"
            >
              {extension.sourceOfTruthUrl}
            </a>
            {Array.isArray(extension.keyClaims) && extension.keyClaims.length > 0 ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-(--text-secondary)">
                {extension.keyClaims.map((k: string, i: number) => <li key={i}>{k}</li>)}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {post.type === "review" && extension ? (
        <Card>
          <CardContent className="space-y-1 p-4">
            <h2 className="text-sm font-semibold text-(--text-primary)">Verdict</h2>
            <p className="text-2xl font-bold text-(--text-accent)">{extension.verdictScore ?? "—"}</p>
            <p className="text-xs text-(--text-muted)">Editorial verdict — display-only, never feeds the community aggregate.</p>
          </CardContent>
        </Card>
      ) : null}

      {post.type === "compare" ? (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-semibold text-(--text-primary)">Comparison</h2>
            {compare ? <CompareGrid rows={compare} /> : <p className="text-sm text-(--text-muted)">Comparison unavailable.</p>}
            {extension?.qualitativeGrid ? (
              <div className="mt-3 space-y-1 text-sm text-(--text-secondary)">
                {Object.entries(extension.qualitativeGrid as Record<string, string>).map(([k, v]) => (
                  <p key={k}><span className="font-medium">{k}:</span> {v}</p>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {post.type === "spark" && extension ? (
        <blockquote className="border-l-2 border-(--border-active) pl-4 text-lg italic text-(--text-primary)">
          {extension.statement}
        </blockquote>
      ) : null}

      {post.type === "debate" && mechanic ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h2 className="text-sm font-semibold text-(--text-primary)">{extension?.proposition}</h2>
            <div className="flex gap-4 text-sm">
              <span className="text-(--text-success)">👍 {mechanic.agreeCount ?? 0} agree</span>
              <span className="text-(--text-error)">👎 {mechanic.disagreeCount ?? 0} disagree</span>
              <span className="text-(--text-muted)">🏳️ {mechanic.abstainCount ?? 0} abstain</span>
            </div>
            <p className="text-xs text-(--text-muted)">Casting/changing your vote lands with the debate mechanic (P4-14).</p>
          </CardContent>
        </Card>
      ) : null}

      {post.type === "list" && mechanic ? (
        <Card>
          <CardContent className="space-y-1 p-4">
            <h2 className="text-sm font-semibold text-(--text-primary)">The list ({mechanic.mode})</h2>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-(--text-secondary)">
              {(mechanic.items ?? []).map((it: any) => (
                <li key={it._id}>{it.content} <span className="text-xs text-(--text-muted)">· {it.voteCount} votes</span></li>
              ))}
            </ol>
            <p className="text-xs text-(--text-muted)">Add/remove/vote land with the list mechanic (P4-14).</p>
          </CardContent>
        </Card>
      ) : null}

      {post.type === "showcase" && extension ? (
        <Card>
          <CardContent className="space-y-2 p-4">
            <h2 className="text-sm font-semibold text-(--text-primary)">{extension.theThing}</h2>
            {extension.projectUrl ? (
              <a
                href={extension.projectUrl}
                target="_blank"
                rel="ugc nofollow noopener noreferrer"
                className="inline-flex items-center rounded-lg border border-(--border-default) px-3 py-1.5 text-sm text-(--text-accent)"
              >
                Visit project ↗
              </a>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {post.type === "help" && mechanic ? (
        <Card>
          <CardContent className="space-y-1 p-4">
            <h2 className="text-sm font-semibold text-(--text-primary)">{extension?.problemStatement}</h2>
            <Badge tone={mechanic.resolvedStatus === "resolved" ? "success" : "warning"}>
              {mechanic.resolvedStatus === "resolved" ? "Resolved" : "Open"}
            </Badge>
            <p className="text-xs text-(--text-muted)">Accept/reopen land with the help mechanic (P4-15).</p>
          </CardContent>
        </Card>
      ) : null}

      {/* CAP-049 structured affiliate CTAs — never prose */}
      {(affiliateCtas ?? []).length > 0 ? (
        <aside className="space-y-2">
          {(affiliateCtas as any[]).map((cta, i) => (
            <a
              key={i}
              href={cta.url}
              target="_blank"
              rel="sponsored nofollow noopener"
              className="flex items-center justify-between rounded-lg border border-(--border-default) bg-(--bg-surface) px-4 py-3 text-sm"
            >
              <span className="font-medium text-(--text-primary)">
                {cta.toolId ? `Explore the tool` : "Sponsored"} <span className="text-xs font-normal text-(--text-muted)">({cta.labelType})</span>
              </span>
              <span className="text-(--text-accent)">Learn more ↗</span>
            </a>
          ))}
        </aside>
      ) : null}

      {/* M6 thread placeholder — honest empty state (Phase 5) */}
      <section className="rounded-lg border border-dashed border-(--border-default) p-6 text-center">
        <p className="text-sm text-(--text-muted)">The discussion thread arrives with the comments engine (Phase 5).</p>
      </section>
    </article>
  );
}

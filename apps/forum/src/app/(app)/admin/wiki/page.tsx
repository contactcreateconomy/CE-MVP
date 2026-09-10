/* eslint-disable @typescript-eslint/no-explicit-any -- Convex boundary */
"use client";

/**
 * Route: /admin/wiki — SLICE-P7A-09 (CAP-418/419/420): staff-gated
 * sanitized-Markdown runbooks. Missing slug = the explicit "no article
 * yet" (CAP-420, quoted); no in-app editor (OQ#3 — deploy-sync only).
 */

import { useState } from "react";
import { useQuery } from "convex/react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonText } from "@/components/ui/skeleton";
import { api } from "../../../../../../../convex/_generated/api";

export default function AdminWikiPage() {
  const [slug, setSlug] = useState("admin-home");
  const list = useQuery(api.admin.wiki?.listSlugs, {});
  const article = useQuery(api.admin.wiki?.get, slug ? { slug } : "skip");

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-text-primary">Operations Wiki</h1>

      {list !== undefined && list.slugs?.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {list.slugs.map((s: any) => (
            <button
              key={s.slug}
              type="button"
              onClick={() => setSlug(s.slug)}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                slug === s.slug ? "bg-brand-primary/10 text-brand-primary" : "bg-bg-overlay text-text-secondary hover:text-text-primary"
              }`}
            >
              {s.title}
            </button>
          ))}
        </div>
      ) : null}

      {article === undefined ? (
        <Card><CardContent className="space-y-2 py-4"><SkeletonText className="w-full" /><SkeletonText className="w-4/5" /></CardContent></Card>
      ) : article.state === "missing" ? (
        // CAP-420 (quoted): explicit "no article yet", not a broken panel
        <Card>
          <CardContent className="py-8">
            <EmptyState compact icon={<span aria-hidden>📄</span>} heading="No article yet" description={article.message} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <h2 className="text-sm font-semibold text-(--text-primary)">{article.title}</h2>
            <Badge tone="neutral">v{article.version}</Badge>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none text-(--text-secondary)">
            <ReactMarkdown>{article.bodyMarkdown}</ReactMarkdown>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

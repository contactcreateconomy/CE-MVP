"use client";

/**
 * LegalDocPage — renders a legal/trust document from the versioned
 * `contentVersions` table (DECISIONS-LOCKED #9). NOT a static page.
 *
 * States per CONTRACT-1-legal-pages: published (markdown in the §11.23
 * reading column) · unavailable_pending_legal (no published row — banner +
 * empty state; the sanctioned pre-publish render) · loading (skeleton).
 */

import { useQuery } from "convex/react";
import ReactMarkdown from "react-markdown";
import { FileWarning } from "lucide-react";

import { api } from "../../../../../convex/_generated/api";
import { Banner } from "@/components/ui/banner";
import { EmptyState } from "@/components/ui/empty-state";
import { SkeletonHeading, SkeletonText } from "@/components/ui/skeleton";

export function LegalDocPage({ docKey }: { docKey: string }) {
  const doc = useQuery(api.legalContent.getPublished, { docKey });

  if (doc === undefined) {
    return (
      <section className="mx-auto w-full max-w-(--container-reading) space-y-3 p-6">
        <SkeletonHeading className="w-2/3" />
        <SkeletonText className="w-full" />
        <SkeletonText className="w-5/6" />
        <SkeletonText className="w-4/5" />
      </section>
    );
  }

  if (doc === null) {
    // contract State 2: unavailable_pending_legal — honest absence
    return (
      <section className="mx-auto w-full max-w-(--container-reading) space-y-3 p-6">
        <h1 className="text-2xl font-semibold text-(--text-primary)">Legal</h1>
        <Banner variant="neutral">
          This document has no published version yet — content is pending legal
          publication.
        </Banner>
        <EmptyState
          compact
          icon={<FileWarning className="size-5" />}
          heading="Unavailable pending legal"
        />
      </section>
    );
  }

  return (
    <section className="animate-route-emerge mx-auto w-full max-w-(--container-reading) space-y-4 p-6">
      {/* §11.23 legal prose: 720px column, sequential headings, versioned footer */}
      <article className="legal-prose">
        <ReactMarkdown
          components={{
            h1: (p) => <h1 className="mb-4 text-2xl font-semibold text-(--text-primary)" {...p} />,
            h2: (p) => <h2 className="mt-8 mb-2 text-xl font-semibold text-(--text-primary)" {...p} />,
            h3: (p) => <h3 className="mt-6 mb-2 text-lg font-semibold text-(--text-primary)" {...p} />,
            p: (p) => <p className="mb-4 text-base leading-7 text-(--text-secondary)" {...p} />,
            ul: (p) => <ul className="mb-4 list-disc space-y-1 pl-6 text-base leading-7 text-(--text-secondary)" {...p} />,
            ol: (p) => <ol className="mb-4 list-decimal space-y-1 pl-6 text-base leading-7 text-(--text-secondary)" {...p} />,
            li: (p) => <li className="text-base leading-7 text-(--text-secondary)" {...p} />,
            strong: (p) => <strong className="font-semibold text-(--text-primary)" {...p} />,
            a: (p) => <a className="text-(--text-link) underline" {...p} />,
            blockquote: (p) => (
              <blockquote className="my-4 border-l-2 border-l-feedback-warning bg-feedback-warning/10 px-4 py-2 text-sm text-(--text-primary)" {...p} />
            ),
            code: (p) => (
              <code className="rounded-sm bg-bg-inset px-1 py-0.5 font-mono text-xs text-(--text-secondary)" {...p} />
            ),
            hr: () => <hr className="my-8 border-border-subtle" />,
          }}
        >
          {doc.bodyMarkdown}
        </ReactMarkdown>
      </article>
      <p className="border-t border-border-subtle pt-4 text-xs text-(--text-muted)">
        {doc.title} · version {doc.version}
        {doc.publishedAt ? ` · effective ${new Date(doc.publishedAt).toISOString().slice(0, 10)}` : ""} · rendered from
        the versioned content store (append-only; rollback = republish a prior version).
      </p>
    </section>
  );
}

"use client";

/**
 * Tool Directory client (SLICE-P4-04) — CAP-111 tools.list with category /
 * tag / search parameters (parameters of the ONE query, per contract §4)
 * and cursor pagination. Tool Card, filter-bar, and pagination primitives
 * have no §11 spec (archetype gaps — flagged in the contract); this composes
 * Card + Input + Select + Button from the kit.
 */

import { useQuery } from "convex/react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PackageSearch, Search } from "lucide-react";

import { Badge, Tag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { api, type Id } from "@/lib/convex";

interface DirectoryTool {
  _id: string;
  name: string;
  slug: string;
  logoAssetId?: string;
  categoryIds: string[];
  pricing?: unknown;
  overall: number | null;
  ratingCount: number;
}

const PAGE_SIZE = 20;

export function ToolsDirectoryClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [cursor, setCursor] = useState<string | null>(null);

  // Select is string-valued; the tag filter param is an Id<"tags"> —
  // the taxonomy rows that populate the Select provide real ids.
  const tagId = (tag || undefined) as Id<"tags"> | undefined;
  const filters = {
    category: category || undefined,
    tag: tagId,
    search: search || undefined,
  };

  const categories = useQuery(api.categories.listActive);
  const taxonomy = useQuery(api.tags.listTaxonomy);
  const firstPage = useQuery(api.tools.list, {
    ...filters,
    numItems: PAGE_SIZE,
  });
  // Subsequent pages keyed by cursor (skipped while first page loads)
  const nextPage = useQuery(
    api.tools.list,
    cursor ? { ...filters, cursor, numItems: PAGE_SIZE } : "skip",
  );

  const tools = useMemo<DirectoryTool[]>(() => {
    const first = firstPage?.tools ?? [];
    if (cursor && nextPage) return nextPage.tools;
    return first;
  }, [cursor, firstPage, nextPage]);

  const activePage = cursor ? nextPage : firstPage;

  const resetFilters = () => {
    setSearch("");
    setCategory("");
    setTag("");
    setCursor(null);
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-4 py-8 md:px-6">
      <h1 className="mb-2 text-2xl font-semibold text-(--text-primary)">Tools</h1>
      <p className="mb-6 text-sm text-(--text-secondary)">
        The operator-curated SaaS registry — community-rated, editorially verdicted.
      </p>

      {/* Filter bar (composed — no §11 filter-bar primitive exists) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-(--text-muted)"
            aria-hidden
          />
          <Input
            aria-label="Search tools"
            placeholder="Search tools…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCursor(null);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v === "all" ? "" : v);
            setCursor(null);
          }}
        >
          <SelectTrigger aria-label="Filter by category" className="w-[190px]">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {((categories ?? []) as any[]).map((c) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={tag}
          onValueChange={(v) => {
            setTag(v === "all" ? "" : v);
            setCursor(null);
          }}
        >
          <SelectTrigger aria-label="Filter by tag" className="w-[170px]">
            <SelectValue placeholder="All tags" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tags</SelectItem>
            {(taxonomy ?? []).map((t) => (
              <SelectItem key={t._id} value={t._id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {firstPage === undefined ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : tools.length === 0 ? (
        <EmptyState
          icon={<PackageSearch className="size-8" aria-hidden />}
          heading={search || category || tag ? "No tools match these filters" : "No tools yet"}
          description={
            search || category || tag
              ? "Try clearing a filter or searching for something else."
              : "The registry is curated by editors. Tools will appear here as they are added."
          }
          action={
            search || category || tag
              ? { label: "Clear filters", onClick: resetFilters, variant: "secondary" }
              : undefined
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Tool directory">
            {tools.map((tool) => (
              <li key={tool._id}>
                <Link
                  href={`/tools/${tool.slug}`}
                  className="block rounded-xl outline-offset-2 focus-visible:ring-2 focus-visible:ring-(--border-active)"
                >
                  <Card className="h-full transition-colors duration-normal hover:border-(--border-prominent)">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-base font-semibold text-(--text-primary)">{tool.name}</h2>
                        <Badge tone={tool.overall === null ? "neutral" : "brand"}>
                          {tool.overall === null ? "—" : `${tool.overall} / 5`}
                        </Badge>
                      </div>
                      <p className="text-xs text-(--text-muted)">
                        {tool.ratingCount === 0
                          ? "No ratings yet"
                          : `${tool.ratingCount} member ${tool.ratingCount === 1 ? "rating" : "ratings"}`}
                      </p>
                      {tool.categoryIds.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tool.categoryIds.slice(0, 3).map((slug) => (
                            <Tag key={slug}>#{slug}</Tag>
                          ))}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6 flex justify-center">
            {activePage && !activePage.isDone ? (
              <Button
                variant="secondary"
                onClick={() => activePage.continueCursor && setCursor(activePage.continueCursor)}
              >
                Load more
              </Button>
            ) : (
              <p className="text-xs text-(--text-muted)">End of directory</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

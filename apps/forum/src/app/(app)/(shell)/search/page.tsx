/**
 * Route: /search?q= — keyword search (SLICE-P6-05, CAP-529): posts,
 * tools, members. Anonymous == member results (quoted). noindex.
 */
import type { Metadata } from "next";

import { SearchPageClient } from "./search-page-client";

export const metadata: Metadata = {
  title: "Search — Createconomy",
  robots: { index: false, follow: true },
};

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

interface SearchPageProps {
  searchParams?: Promise<{ q?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const q = (firstSearchParam(resolved?.q) ?? "").trim();

  return <SearchPageClient initialQuery={q} />;
}

/**
 * Route: /search?q=&category=
 */
import { SearchPageClient } from "./search-page-client";

function firstSearchParam(value: string | string[] | undefined): string | undefined {
  if (value === undefined) return undefined;
  return Array.isArray(value) ? value[0] : value;
}

interface SearchPageProps {
  searchParams?: Promise<{ q?: string | string[]; category?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolved = await searchParams;
  const qRaw = firstSearchParam(resolved?.q) ?? "";
  const q = qRaw.trim();
  const category = firstSearchParam(resolved?.category);

  return <SearchPageClient q={q} category={category} />;
}

"use client";

import { useQuery } from "convex/react";

import {
  TopPostHeroCarousel,
  TopPostHeroCarouselEmpty,
  TopPostHeroCarouselSkeleton,
} from "@/components/feed/top-post-hero-carousel";
import { api } from "@/lib/convex";
import type { TopPostHeroSlide } from "@/types/hero";
import { isConvexConfigured } from "@cemvp/convex-client";

function TopPostHeroSectionWithConvex() {
  // P7-CLEANUP: the canonical hero (feed.getChrome — CAP-192's own data)
  const chrome = useQuery(api.feed.getChrome, {});
  type HeroRow = {
    slotOrder: number;
    postId: string;
    slug: string | null;
    title: string;
    ctaLabel: string | null;
    disclosureClass: string;
    isCommunityTop: boolean;
  };
  const raw = (chrome as { hero?: HeroRow[] } | undefined)?.hero ?? [];
  const slides: TopPostHeroSlide[] = raw
    .filter((h): h is HeroRow & { slug: string } => h.slug !== null)
    .map((h) => ({
      id: h.postId,
      slug: h.slug,
      discussionHref: `/discussions/${h.slug}`,
      title: h.title,
      summary: h.isCommunityTop ? "Community Top — the freshest active slots." : "Editorially selected.",
      reads: 0, // legacy counters retired; hero copy carries the slot, not vanity counts
      comments: 0,
      shares: 0,
      eyebrow: h.isCommunityTop ? "Community Top" : "Featured",
      ctaLabel: h.ctaLabel ?? "Read",
      accentRgb: "88 101 242" as const, // brand accent (display concern)
    }));

  if (chrome === undefined) {
    return <TopPostHeroCarouselSkeleton className="h-[440px] xl:h-[520px]" />;
  }

  if (slides.length === 0) {
    return <TopPostHeroCarouselEmpty className="h-[440px] xl:h-[520px]" />;
  }

  return <TopPostHeroCarousel slides={slides} />;
}

/** Avoid `useQuery` when Convex is not configured (e.g. Vercel build without `NEXT_PUBLIC_CONVEX_URL`) — `useQuery` still requires a provider even with `"skip"`. */
export function TopPostHeroSection() {
  if (!isConvexConfigured()) {
    return null;
  }
  return <TopPostHeroSectionWithConvex />;
}

"use client";

import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";

import { toHeroSlides } from "@/components/feed/feed-adapter";
import { FeedHeroCarousel, FeedHeroCarouselSkeleton } from "@/components/feed/feed-hero-carousel";
import { api } from "@/lib/convex";
import { isConvexConfigured } from "@cemvp/convex-client";

/** Shell hero on non-feed shell routes: the canonical carousel fed by
 *  feed.getChrome (L-31 no autoplay, L-43 centred cover-flow). On /feed the
 *  hero lives inside FeedPageView, so the shell renders none (FEED-U2). */
function TopPostHeroSectionWithConvex() {
  const chrome = useQuery(api.feed.getChrome, {});
  const slides = chrome === undefined ? [] : toHeroSlides((chrome as { hero?: unknown[] }).hero as never);
  if (chrome !== undefined && slides.length === 0) return null;
  return (
    <section className="mx-auto hidden w-full max-w-(--container-app) px-4 pb-2 pt-6 md:px-6 lg:block lg:px-8">
      {chrome === undefined ? <FeedHeroCarouselSkeleton /> : <FeedHeroCarousel slides={slides} />}
    </section>
  );
}

/** Avoid `useQuery` when Convex is not configured (e.g. Vercel build without `NEXT_PUBLIC_CONVEX_URL`) — `useQuery` still requires a provider even with `"skip"`. */
export function TopPostHeroSection() {
  const pathname = usePathname();
  if (pathname === "/feed" || !isConvexConfigured()) {
    return null;
  }
  return <TopPostHeroSectionWithConvex />;
}

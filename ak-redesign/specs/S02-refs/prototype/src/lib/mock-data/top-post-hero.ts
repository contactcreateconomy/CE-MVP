import type { Post } from "@/types";

import { posts } from "./posts";

interface TopPostHeroSelection {
  postId: string;
  shares: number;
  eyebrow?: string;
  ctaLabel?: string;
  accentRgb?: `${number} ${number} ${number}`;
}

export interface TopPostHeroSlide {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverImage?: string;
  reads: number;
  comments: number;
  shares: number;
  eyebrow: string;
  ctaLabel: string;
  accentRgb: `${number} ${number} ${number}`;
}

export const topPostHeroSelection: TopPostHeroSelection[] = [
  { postId: "p1", shares: 1480, eyebrow: "Editor’s Pick", accentRgb: "14 165 233" },
  { postId: "p14", shares: 1125, eyebrow: "Trending Deep Dive", accentRgb: "99 102 241" },
  { postId: "p19", shares: 1295, eyebrow: "Creator Playbook", accentRgb: "236 72 153" },
  { postId: "p27", shares: 986, eyebrow: "Build in Public", accentRgb: "34 197 94" },
  { postId: "p39", shares: 1204, eyebrow: "Launch Story", accentRgb: "168 85 247" },
  { postId: "p44", shares: 1572, eyebrow: "Workflow Sprint", accentRgb: "249 115 22" },
  { postId: "p53", shares: 1108, eyebrow: "Creator Debate", accentRgb: "244 63 94" },
  { postId: "p61", shares: 934, eyebrow: "Help Desk Highlight", accentRgb: "56 189 248" },
  { postId: "p74", shares: 1411, eyebrow: "Top Lists", accentRgb: "234 179 8" },
  { postId: "p88", shares: 1022, eyebrow: "Talent Spotlight", accentRgb: "20 184 166" },
];

export function getTopPostHeroSlides(sourcePosts: Post[] = posts): TopPostHeroSlide[] {
  return topPostHeroSelection.reduce<TopPostHeroSlide[]>((slides, item) => {
    const post = sourcePosts.find((entry) => entry.id === item.postId);

    if (!post || !post.coverImage) {
      return slides;
    }

    slides.push({
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      coverImage: post.coverImage,
      reads: post.views,
      comments: post.commentsCount,
      shares: item.shares,
      eyebrow: item.eyebrow ?? "Featured Story",
      ctaLabel: item.ctaLabel ?? "Read",
      accentRgb: item.accentRgb ?? "14 165 233",
    });

    return slides;
  }, []);
}

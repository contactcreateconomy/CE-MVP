export interface TopPostHeroSlide {
  id: string;
  slug: string;
  /** Full path for the featured discussion page. */
  discussionHref: string;
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

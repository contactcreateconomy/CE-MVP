/**
 * Shared identity type for future cross-app user identity.
 * Forum currently uses forumProfiles. This type will be the
 * bridge when seller/marketplace/creator apps go live.
 */
export interface PlatformIdentity {
  userId: string;
  handle: string;
  name: string;
  image?: string;
  apps: ("forum" | "seller" | "marketplace" | "creator")[];
  reputation: {
    forum?: { points: number; level: number; streakDays: number };
  };
}

/**
 * A reference to content in any Createconomy app.
 * Used in category payloads to link to cross-app entities.
 */
export interface ContentReference {
  app: "forum" | "seller" | "marketplace" | "creator";
  contentType: string;
  contentId: string;
  displayName?: string;
  thumbnailUrl?: string;
}

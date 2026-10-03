export type CategoryKey =
  | "news"
  | "review"
  | "compare"
  | "launch-pad"
  | "debate"
  | "help"
  | "list"
  | "showcase"
  | "gigs";

export interface Category {
  key: CategoryKey;
  name: string;
  icon: string;
  description: string;
  primaryColor: string;
  lockedByDefault: boolean;
  pointsToUnlock?: number;
}

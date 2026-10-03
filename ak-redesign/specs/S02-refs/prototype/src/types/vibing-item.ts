export type VibingItemKind = "campaign" | "post" | "discussion" | "update" | "creator";

export interface VibingItem {
  id: string;
  kind: VibingItemKind;
  label: string;
  href: string;
  engagedUsers: number;
}

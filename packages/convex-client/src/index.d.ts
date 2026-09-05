export type AppId = "forum" | "seller" | "admin" | "marketplace";

export declare const APP_IDS: AppId[];
export declare function getConvexUrl(): string | null;
export declare function isConvexConfigured(): boolean;

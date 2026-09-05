import { SparkBody } from "./SparkBody";
import type { CategoryTemplate } from "../types";

/**
 * Spec-aligned spark template (2026-08-31): one sharp statement, max 280 chars,
 * no structured body — the statement IS the card (CONTRACT-6-feed §3H CardExtras).
 */
export const sparkTemplate: CategoryTemplate = {
  key: "spark",
  Body: SparkBody as CategoryTemplate["Body"],
  nudge: "One sharp statement — no body needed. If you can't say it in a line, it isn't a spark.",
};

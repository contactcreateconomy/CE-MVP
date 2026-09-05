import { ReviewBody } from "./ReviewBody";
import { ReviewCardExtras } from "./ReviewCardExtras";
import { ReviewInsights } from "./ReviewInsights";
import type { CategoryTemplate } from "../types";

/** ComposeForm archived 2026-08-31 (reply-as-review → FUTURE-M6-02); typed review composition lives at /compose/[type]. */
export const reviewTemplate: CategoryTemplate = {
  key: "review",
  Body: ReviewBody as CategoryTemplate["Body"],
  Insights: ReviewInsights,
  CardExtras: ReviewCardExtras,
  nudge: "Mention which version or plan you used — context builds trust.",
};

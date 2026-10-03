import { ReviewBody } from "./ReviewBody";
import { ReviewCardExtras } from "./ReviewCardExtras";
import { ReviewComposeForm } from "./ReviewComposeForm";
import { ReviewInsights } from "./ReviewInsights";
import type { CategoryTemplate } from "../types";

export const reviewTemplate: CategoryTemplate = {
  key: "review",
  Body: ReviewBody as CategoryTemplate["Body"],
  Insights: ReviewInsights,
  ComposeForm: ReviewComposeForm,
  CardExtras: ReviewCardExtras,
  nudge: "Mention which version or plan you used — context builds trust.",
};

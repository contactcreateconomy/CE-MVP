import { NewsBody } from "./NewsBody";
import { NewsInsights } from "./NewsInsights";
import type { CategoryTemplate } from "../types";

export const newsTemplate: CategoryTemplate = {
  key: "news",
  Body: NewsBody as CategoryTemplate["Body"],
  Insights: NewsInsights,
  nudge: "Adding a source link makes your reply 4x more likely to be upvoted.",
};

import { ListBody } from "./ListBody";
import { ListInsights } from "./ListInsights";
import type { CategoryTemplate } from "../types";

export const listTemplate: CategoryTemplate = {
  key: "list",
  Body: ListBody as CategoryTemplate["Body"],
  Insights: ListInsights,
  nudge: "If you're suggesting an addition, explain why it meets the stated criteria.",
};

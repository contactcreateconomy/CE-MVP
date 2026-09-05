import { CompareBody } from "./CompareBody";
import type { CategoryTemplate } from "../types";

export const compareTemplate: CategoryTemplate = {
  key: "compare",
  Body: CompareBody as CategoryTemplate["Body"],
  nudge: "Which use case are you optimising for? It makes your comparison actionable.",
};

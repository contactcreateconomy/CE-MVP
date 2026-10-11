import type { CategoryTemplate } from "./types";

// Eager imports — full TS safety, simple synchronous API.
// Template objects are lightweight references; actual component code is
// code-split by Next.js at the route level.
import { newsTemplate } from "./news/index";
import { reviewTemplate } from "./review/index";
import { compareTemplate } from "./compare/index";
import { launchpadTemplate } from "./launch-pad/index";
import { debateTemplate } from "./debate/index";
import { qaTemplate } from "./qa/index";
import { listTemplate } from "./list/index";
import { showcaseTemplate } from "./showcase/index";
import { gigsTemplate } from "./gigs/index";

const registry = new Map<string, CategoryTemplate>([
  [newsTemplate.key, newsTemplate],
  [reviewTemplate.key, reviewTemplate],
  [compareTemplate.key, compareTemplate],
  [launchpadTemplate.key, launchpadTemplate],
  [debateTemplate.key, debateTemplate],
  ["help", qaTemplate],
  [qaTemplate.key, qaTemplate],
  [listTemplate.key, listTemplate],
  [showcaseTemplate.key, showcaseTemplate],
  [gigsTemplate.key, gigsTemplate],
]);

export function getCategoryTemplate(key: string): CategoryTemplate | null {
  return registry.get(key) ?? null;
}

import { GigsBody } from "./GigsBody";
import { GigsCardExtras } from "./GigsCardExtras";
import type { CategoryTemplate } from "../types";

/** ComposeForm archived 2026-08-31 — gigs is DAU-locked; typed composition lives at /compose/[type] when the flip happens. */
export const gigsTemplate: CategoryTemplate = {
  key: "gigs",
  Body: GigsBody as CategoryTemplate["Body"],
  CardExtras: GigsCardExtras,
  nudge: "If you're a candidate, lead with your most relevant work, not your resume.",
};

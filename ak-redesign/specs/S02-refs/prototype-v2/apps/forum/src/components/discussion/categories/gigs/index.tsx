import { GigsBody } from "./GigsBody";
import { GigsCardExtras } from "./GigsCardExtras";
import { GigsComposeForm } from "./GigsComposeForm";
import type { CategoryTemplate } from "../types";

export const gigsTemplate: CategoryTemplate = {
  key: "gigs",
  Body: GigsBody as CategoryTemplate["Body"],
  ComposeForm: GigsComposeForm,
  CardExtras: GigsCardExtras,
  nudge: "If you're a candidate, lead with your most relevant work, not your resume.",
};

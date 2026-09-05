/**
 * Route: /content/spark
 * Spark content page — minimal mode sandbox.
 * For uncategorized free-form posts (Twitter-style thoughts).
 * Uses dedicated short seed copy (not the mother article).
 */
import { ContentPageClient } from "../content-page-client";
import { seedSparkComments, seedSparkThread } from "../_seed";

export default function SparkPage() {
  return (
    <ContentPageClient mode="minimal" thread={seedSparkThread} comments={seedSparkComments} />
  );
}

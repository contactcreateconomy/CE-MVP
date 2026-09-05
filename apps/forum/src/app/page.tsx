import { redirect } from "next/navigation";

/**
 * `/` → `/feed` is also declared in `next.config.mjs` `redirects()` so most requests never enter the RSC root page
 * (helps avoid flaky dev 500s with a stale `.next`). This remains as a fallback if the page is ever rendered.
 */
export default function HomePage() {
  redirect("/feed");
}

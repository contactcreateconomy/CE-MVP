# baseline/ — READ BEFORE USING

**These 30 PNGs (2026-09-27) are NOT usable design baselines.**
Every route (including the static /category/debate) rendered the Next.js dev
error overlay because the shared Convex dev deployment (`watchful-chameleon-570`)
is **disabled — free-plan limits exceeded** ("This deployment has been disabled").

What each file actually shows: the Next.js 16.3.3 dev error overlay over a dark
page shell. /category/ai-technology was captured before correcting the slug
(valid keys are post types: news/review/compare/…); those two files were replaced
by /category/debate captures.

## Re-capturing real baselines (after Convex is re-enabled)

```bash
pnpm dev   # from repo root, wait for ready
routes="landing:/landing signin:/signin setup:/setup feed:/feed \
new-post:/new-post profile:/profile notifications:/notifications search:/search \
discover:/discover leaderboard:/leaderboard drafts:/drafts settings:/settings \
discussions-<real-slug>:/discussions/<real-slug> users-<handle>:/users/<handle> \
category-debate:/category/debate"
for vp in 390x844 1440x900; do size=${vp%x*}
  for pair in $routes; do name=${pair%%:*}; url=${pair#*:}
    pnpm exec playwright screenshot --viewport-size="$size,${vp#*x}" \
      --wait-for-timeout=3500 --timeout=45000 "http://localhost:3000$url" \
      "ak-redesign/00-control/baseline/${name}-${size}.png"
  done
done
```

Note: `--wait-until=networkidle` must NOT be used — Convex websockets keep the
network busy and every capture times out. Real post slugs are not statically
discoverable (demoSeed inserts posts without explicit slugs); get one from the
live deployment (e.g. the feed) once it is re-enabled. /welcome 307-redirects
to /feed (no capture needed).

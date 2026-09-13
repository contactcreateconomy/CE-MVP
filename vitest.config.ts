import { defineConfig } from "vitest/config";
import path from "path";

/**
 * ROOT test runner — Convex pure-logic unit tests (Testing-Strategy row 4).
 *
 * Files under convex/ cannot hold their own *.test.ts (the Convex bundler
 * would try to deploy them), so tests live in tests/convex/ at the repo
 * root and import the pure modules directly. This config deliberately does
 * NOT include apps/forum (that workspace has its own vitest.config.ts and
 * its own dev-deps; the root package.json "test:run" script keeps pointing
 * there so the existing 949-test suite and CI stay untouched).
 *
 * Run: pnpm test:convex   (added to CI after the forum gate)
 */
export default defineConfig({
  test: {
    include: ["tests/convex/**/*.test.ts"],
    environment: "node",
  },
  resolve: {
    alias: {
      // Convex modules import helpers via relative paths only; alias kept
      // for future tests that prefer the package-style import.
      "@convex-root": path.resolve(__dirname, "./convex"),
    },
  },
});

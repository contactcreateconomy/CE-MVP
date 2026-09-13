import { defineConfig, devices } from "@playwright/test";

/**
 * CE-MVP E2E config. Runs against the forum dev server (Turbopack) which it
 * starts itself via `webServer`. Locally it picks up NEXT_PUBLIC_CONVEX_URL
 * from apps/forum/.env.local (live dev deployment). In CI without a Convex
 * URL the app's isConvexConfigured() guards keep pages renderable.
 *
 * Pipeline E2Es (submit → H-SAFE → qualify) are quarantined behind
 * E2E_PIPELINE_ENABLED until the founder-owned GLM/classifier keys land.
 */
const PORT = 3000;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    navigationTimeout: 60_000, // first Turbopack compile of a route is slow
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: `http://localhost:${PORT}/feed`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

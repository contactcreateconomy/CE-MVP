import { test, expect } from "@playwright/test";

/**
 * Smoke journeys — deterministic public surfaces only.
 * Deliberately asserts nothing that depends on Convex data shape or the
 * founder-keyed pipeline. Journey E2Es (auth, composer, qualify) land with
 * the P4/P5 exit-gate suites behind E2E_PIPELINE_ENABLED.
 */
test.describe("smoke", () => {
  test("root redirects to /feed", async ({ page }) => {
    const res = await page.goto("/");
    expect(res?.status(), "`/` should answer (config or RSC redirect)").toBeLessThan(400);
    await expect(page).toHaveURL(/\/feed$/);
  });

  test("/feed renders without an application error", async ({ page }) => {
    const res = await page.goto("/feed");
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("text=Application error")).toHaveCount(0);
  });

  test("/signin renders", async ({ page }) => {
    const res = await page.goto("/signin");
    expect(res?.status()).toBe(200);
    await expect(page.locator("body")).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

/**
 * S00-T03 glass utilities — the tests that can fail (review R1 BLOCK:
 * "12px saturate(150%)" is not a backdrop-filter value; browsers compute
 * none, and a none-assertion proves nothing). Proves BOTH sides in a real
 * Chromium against /lab/utilities:
 *
 *   normal:            computed backdrop-filter is NOT none and contains blur(…)
 *   reduced-transp.:   computed backdrop-filter IS none and the fill is opaque
 *
 * PW_CHANNEL env selects a system browser channel where the Playwright CDN
 * download is unavailable (CI keeps bundled chromium).
 */
const channel = process.env.PW_CHANNEL;
if (channel) test.use({ channel });

const GLASS_ROWS = [
  { testId: "glass-chrome-demo", name: ".glass-chrome" },
  { testId: "glass-strong-demo", name: ".glass-strong" },
] as const;

async function computed(page: import("@playwright/test").Page, testId: string) {
  return page.getByTestId(testId).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    return { backdrop: cs.backdropFilter, bg: cs.backgroundColor };
  });
}

/** rgb(...) / color(srgb … / A) → alpha as a number (1 when opaque). */
function alphaOf(bg: string): number {
  const slash = bg.lastIndexOf("/");
  if (slash < 0) return 1; // rgb(r, g, b) — opaque
  const m = bg.slice(slash + 1).match(/([\d.]+)\)?/);
  return m ? Number(m[1]) : NaN;
}

test.describe("glass utilities (S00-T03, spec §5.3)", () => {
  for (const { testId, name } of GLASS_ROWS) {
    test(`normal: ${name} blurs (backdrop-filter is a real filter)`, async ({ page }) => {
      await page.goto("/lab/utilities", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);
      const { backdrop } = await computed(page, testId);
      expect(backdrop, `${name} backdrop-filter must not compute none`).not.toBe("none");
      expect(backdrop ?? "", `${name} backdrop-filter must contain blur(…)`).toContain("blur(");
    });
  }

  for (const { testId, name } of GLASS_ROWS) {
    test(`reduced-transparency: ${name} falls back to solid (no blur, opaque fill)`, async ({ page }) => {
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Emulation.setEmulatedMedia", {
        features: [{ name: "prefers-reduced-transparency", value: "reduce" }],
      });
      await page.goto("/lab/utilities", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(2500);
      expect(
        await page.evaluate(() => matchMedia("(prefers-reduced-transparency: reduce)").matches),
        "emulation must actually match the media query",
      ).toBe(true);
      const { backdrop, bg } = await computed(page, testId);
      expect(backdrop, `${name} backdrop-filter must be none under reduced transparency`).toBe("none");
      expect(alphaOf(bg), `${name} fill must be fully opaque, got "${bg}"`).toBe(1);
    });
  }
});

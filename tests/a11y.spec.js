// Automated accessibility checks (WCAG 2.1 A/AA) with axe, at desktop and phone widths.
// Automated checks catch roughly a third of problems; still test with a keyboard
// and a screen reader before launch.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { ALL_PAGES } = require("./helpers");

for (const path of ALL_PAGES) {
  test(`${path} has no automatically detectable accessibility problems`, async ({ page }) => {
    await page.goto(path);
    // Let the hero drawing and version check settle.
    await page.waitForTimeout(300);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    const summary = results.violations.map(
      (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`
    );
    expect(summary).toEqual([]);
  });
}

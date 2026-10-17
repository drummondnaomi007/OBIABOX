// Automated accessibility checks (WCAG 2.1 A/AA) with axe, at desktop and phone widths.
// Automated checks catch roughly a third of problems; still test with a keyboard
// and a screen reader before launch.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { ALL_PAGES } = require("./helpers");

async function axeSummary(page) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  return results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`
  );
}

for (const scheme of ["light", "dark"]) {
  test.describe(`${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const path of ALL_PAGES) {
      test(`${path} has no automatically detectable accessibility problems (${scheme})`, async ({ page }) => {
        await page.goto(path);
        // Let the hero drawing and version check settle.
        await page.waitForTimeout(300);
        expect(await axeSummary(page)).toEqual([]);
      });
    }
  });
}

// Headings go down one level at a time (h1, then h2, then h3), so screen
// reader users can jump through a page by its outline.
for (const path of ALL_PAGES) {
  test(`${path} never skips a heading level`, async ({ page }) => {
    await page.goto(path);
    const skips = await page.evaluate(() => {
      const out = [];
      let last = 0;
      for (const h of document.querySelectorAll("h1, h2, h3, h4, h5, h6")) {
        const level = Number(h.tagName[1]);
        if (last && level > last + 1) out.push(`h${last} → h${level} "${h.textContent.trim()}"`);
        last = level;
      }
      return out;
    });
    expect(skips).toEqual([]);
  });
}

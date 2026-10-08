// Guides page: tick-off steps, saved progress, clear and print one guide.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("guides.html");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("there are eight guides, each with steps and a tip", async ({ page }) => {
  const guides = page.locator("[data-guide]");
  await expect(guides).toHaveCount(8);
  for (let i = 0; i < 8; i++) {
    const g = guides.nth(i);
    expect(await g.locator(".guide-steps li").count()).toBeGreaterThanOrEqual(5);
    await expect(g.locator(".guide-tip")).toBeVisible();
  }
  await expect(page.locator(".guide-index li")).toHaveCount(8);
});

test("ticking steps updates progress and survives a reload", async ({ page }) => {
  const setup = page.locator("#setup");
  const progress = setup.locator("[data-progress]");
  await expect(progress).toHaveText("0 of 6 done");
  await setup.locator(".guide-steps li").nth(0).locator("label").click();
  await setup.locator(".guide-steps li").nth(1).locator("label").click();
  await expect(progress).toHaveText("2 of 6 done");
  await expect(setup.locator(".guide-steps li").nth(0)).toHaveClass(/done/);

  await page.reload();
  await expect(page.locator("#setup [data-progress]")).toHaveText("2 of 6 done");
  await expect(page.locator("#setup .guide-steps input").nth(1)).toBeChecked();
});

test("ticking every step marks the guide complete, and Clear ticks resets it", async ({ page }) => {
  const money = page.locator("#money");
  const labels = money.locator(".guide-steps label");
  const n = await labels.count();
  for (let i = 0; i < n; i++) await labels.nth(i).click();
  await expect(money.locator("[data-progress]")).toHaveText("All done ✓");
  await expect(money).toHaveClass(/complete/);
  await money.locator("[data-reset-guide]").click();
  await expect(money.locator("[data-progress]")).toHaveText(`0 of ${n} done`);
  await expect(money).not.toHaveClass(/complete/);
});

test("printing one guide hides the others and the buttons", async ({ page }) => {
  await page.evaluate(() => {
    window.print = () => {};
  });
  await page.locator("#monday [data-print-guide]").click();
  await page.emulateMedia({ media: "print" });
  const shown = await page.$$eval("main > section", (ss) =>
    ss.filter((s) => getComputedStyle(s).display !== "none").map((s) => s.id)
  );
  expect(shown).toEqual(["monday"]);
  await expect(page.locator("#monday [data-print-guide]")).toBeHidden();
  await expect(page.locator(".build-tracker")).toBeHidden();
});

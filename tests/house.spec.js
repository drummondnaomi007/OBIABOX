// The line-drawn house: hero drawing, build tracker and building across pages.
const { test, expect } = require("@playwright/test");
const { PAGES, scrollToFraction } = require("./helpers");

test.beforeEach(async ({ page }) => {
  // Start every test with an empty build.
  await page.goto("index.html");
  await page.evaluate(() => localStorage.clear());
});

test("hero house is drawn on the home page card and on other pages", async ({ page }) => {
  await page.goto("index.html");
  await expect(page.locator(".hero-card .card-house")).toBeAttached();
  await page.goto("features.html");
  await expect(page.locator(".hero .hero-house")).toBeAttached();
});

test("tracker moves through the stages as you scroll one page", async ({ page }) => {
  await page.goto("index.html");
  const stage = page.locator(".build-stage");
  await expect(stage).toHaveText("Site set-out");
  await expect(page.locator(".build-count")).toHaveText(`1 of ${PAGES.length} pages`);
  await scrollToFraction(page, 1);
  // One page out of nine is about 11% of the build: the slab stage.
  await expect(stage).toHaveText("Slab");
});

test("the house keeps building across pages and remembers progress", async ({ page }) => {
  for (const path of PAGES.slice(0, 4)) {
    await page.goto(path);
    await scrollToFraction(page, 1);
  }
  await expect(page.locator(".build-count")).toHaveText(`4 of ${PAGES.length} pages`);
  const midStage = await page.locator(".build-stage").textContent();
  expect(["Roof", "Frame"]).toContain(midStage);

  // Going back to a finished page doesn't undo anything.
  await page.goto("index.html");
  await expect(page.locator(".build-count")).toHaveText(`4 of ${PAGES.length} pages`);
  await expect(page.locator(".build-stage")).toHaveText(midStage);
});

test("reading every page reaches handover, and Build again starts over", async ({ page }) => {
  for (const path of PAGES) {
    await page.goto(path);
    await scrollToFraction(page, 1);
  }
  const tracker = page.locator(".build-tracker");
  await expect(page.locator(".build-stage")).toHaveText("Handover ✓");
  await expect(tracker).toHaveClass(/done/);
  const again = page.locator(".build-again");
  await expect(again).toBeVisible();
  await again.click();
  await expect(tracker).not.toHaveClass(/done/);
  await expect(page.locator(".build-count")).toHaveText(`1 of ${PAGES.length} pages`);
});

test("with reduced motion the hero house is shown without animation", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("features.html");
  const svg = page.locator(".hero-house");
  await expect(svg).toBeAttached();
  await expect(svg).not.toHaveClass(/animate/);
  await context.close();
});

// Every page loads cleanly and fits the screen (runs at desktop and phone widths).
const { test, expect } = require("@playwright/test");
const { PAGES, watchErrors, expectNoSidewaysScroll } = require("./helpers");

for (const path of PAGES) {
  test(`${path} loads without errors and fits the screen`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(path);
    await expect(page.locator(".site-header .brand")).toContainText("Owner Builder in a Box");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator(".site-footer")).toBeVisible();
    await expect(page.locator(".build-tracker")).toBeVisible();
    await expectNoSidewaysScroll(page);
    expect(errors).toEqual([]);
  });
}

test("the menu lists every main page, with the current one marked", async ({ page }) => {
  await page.goto("guides.html");
  const links = page.locator(".nav-links a");
  for (const name of ["Home", "Features", "Neighbour Notices", "Guides", "About", "Contact", "Join the waitlist"]) {
    await expect(links.filter({ hasText: name }).first()).toBeAttached();
  }
  await expect(page.locator(".nav-links a.active")).toHaveText("Guides");
});

test("the menu button opens and closes the menu on small screens", async ({ page, isMobile }) => {
  test.skip(!isMobile, "menu button only shows on small screens");
  await page.goto("index.html");
  const toggle = page.locator(".nav-toggle");
  const links = page.locator(".nav-links");
  await expect(toggle).toBeVisible();
  await expect(links).not.toHaveClass(/open/);
  await toggle.click();
  await expect(links).toHaveClass(/open/);
  await expect(links.getByRole("link", { name: "Guides" })).toBeVisible();
  await toggle.click();
  await expect(links).not.toHaveClass(/open/);
});

test("internal links point at pages that exist", async ({ page, request }) => {
  const seen = new Set();
  for (const path of PAGES) {
    await page.goto(path);
    const hrefs = await page.$$eval("a[href]", (as) => as.map((a) => a.href));
    for (const href of hrefs) {
      const url = new URL(href);
      if (url.hostname !== "localhost") continue;
      url.hash = "";
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      const res = await request.get(url.href);
      expect(res.status(), `broken link on ${path}: ${url.pathname}`).toBe(200);
    }
  }
});

// Every page loads cleanly and fits the screen (runs at desktop and phone widths).
const { test, expect } = require("@playwright/test");
const { ALL_PAGES, watchErrors, expectNoSidewaysScroll, expectNothingOffScreen } = require("./helpers");

for (const path of ALL_PAGES) {
  test(`${path} loads without errors and fits the screen`, async ({ page }) => {
    const errors = watchErrors(page);
    await page.goto(path);
    await expect(page.locator(".site-header .brand")).toContainText("Owner Builder in a Box");
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator(".site-footer")).toBeVisible();
    await expect(page.locator(".build-tracker")).toBeVisible();
    await expectNoSidewaysScroll(page);
    await expectNothingOffScreen(page);
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
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(links).not.toHaveClass(/open/);
  await toggle.click();
  await expect(links).toHaveClass(/open/);
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(links.getByRole("link", { name: "Guides" })).toBeVisible();
  await toggle.click();
  await expect(links).not.toHaveClass(/open/);

  // Escape closes it and returns focus to the button.
  await toggle.click();
  await page.keyboard.press("Escape");
  await expect(links).not.toHaveClass(/open/);
  await expect(toggle).toBeFocused();
});

test("the first Tab press reaches the skip link, which jumps to the content", async ({ page }) => {
  await page.goto("features.html");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await expect(page.locator("main#main")).toHaveCount(1);
});

test("internal links point at pages that exist", async ({ page, request }) => {
  const seen = new Set();
  for (const path of ALL_PAGES) {
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

// On phones every button and stand-alone link is at least 44px tall,
// so it can be tapped with a thumb. Links inside sentences are exempt.
test("tap targets are at least 44px tall on phones", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "phone-only check");
  const small = [];
  for (const path of ALL_PAGES) {
    await page.goto(path);
    const found = await page.evaluate(() => {
      const out = [];
      for (const el of document.querySelectorAll("a[href], button, input, select, summary")) {
        const r = el.getBoundingClientRect();
        if (!r.width || getComputedStyle(el).visibility === "hidden") continue;
        if (el.tagName === "A" && getComputedStyle(el).display === "inline" && el.closest("p, td, li > span")) continue;
        if (el.matches("input[type=checkbox], input[type=radio]") && el.closest("label")) continue;
        if (r.height < 43.5) out.push(`${el.tagName.toLowerCase()} "${(el.textContent || el.name || "").trim().slice(0, 30)}" is ${Math.round(r.height)}px`);
      }
      return out;
    });
    small.push(...found.map((f) => `${path}: ${f}`));
  }
  expect(small).toEqual([]);
});

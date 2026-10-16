// Edge cases: no JavaScript, blocked storage, finding out more.
const { test, expect } = require("@playwright/test");
const { watchErrors } = require("./helpers");

test("without JavaScript the pages still read properly", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("index.html");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.locator("[data-year]")).not.toBeEmpty();
  await page.goto("demo/app.html");
  await expect(page.locator(".noscript-note")).toBeVisible();
  await context.close();
});

test("with browser storage blocked, nothing breaks and ticks still work for the visit", async ({ browser }) => {
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw new Error("storage blocked");
      }
    });
  });
  const page = await context.newPage();
  const errors = watchErrors(page);
  for (const p of ["index.html", "guides.html", "demo/app.html"]) await page.goto(p);
  await page.goto("guides.html");
  await page.locator("#setup .guide-steps label").first().click();
  await expect(page.locator("#setup [data-progress]")).toHaveText("1 of 6 done");
  await expect(page.locator(".build-tracker")).toBeVisible();
  expect(errors).toEqual([]);
  await context.close();
});

test("the home page points people to the mockups, guides and FAQ", async ({ page }) => {
  await page.goto("index.html");
  for (const href of ["demo/app.html", "guides.html", "faq.html"]) {
    await expect(page.locator(`a.card-link[href="${href}"]`)).toBeVisible();
  }
});

test("the FAQ answers the common questions and links onward", async ({ page }) => {
  await page.goto("faq.html");
  expect(await page.locator(".faq details").count()).toBeGreaterThanOrEqual(10);
  const q = page.locator("summary", { hasText: "How much will it cost?" });
  await q.click();
  await expect(q.locator("xpath=..")).toHaveAttribute("open", "");
  await expect(page.locator(".faq-more a[href='contact.html']")).toBeVisible();
});

test("the contact page has a fallback when no email app opens", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("contact.html");
  await expect(page.locator("main")).toContainText("Nothing happened when you pressed the button?");
  const copy = page.locator("[data-copy-text]");
  await copy.click();
  await expect(copy).toHaveText("Copied ✓");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe("hello@tradiesbureau.com");
});

test("sharing a link shows a proper preview", async ({ page, request }) => {
  await page.goto("index.html");
  const image = await page.getAttribute('meta[property="og:image"]', "content");
  expect(image).toMatch(/^https:\/\/.+\/assets\/og-image\.png$/);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Owner Builder in a Box/);
  const local = await request.get("assets/og-image.png");
  expect(local.status()).toBe(200);
});

test("search engines can find the sitemap, and broken links get a friendly page", async ({ page, request }) => {
  expect((await request.get("robots.txt")).status()).toBe(200);
  const sitemap = await (await request.get("sitemap.xml")).text();
  expect(sitemap).toContain("faq.html");
  await page.goto("404.html");
  await expect(page.locator("h1")).toContainText("walkabout");
  await expect(page.locator(".btn-row a")).toHaveCount(4);
});

// Waitlist form and visitor stats, switched on by js/config.js.
const { test, expect } = require("@playwright/test");

// Serve a js/config.js with the given settings, and never really contact
// Cloudflare or Tally from the tests.
async function useConfig(page, settings) {
  await page.route("**/js/config.js", (route) =>
    route.fulfill({
      contentType: "text/javascript",
      body: "window.OBIAB_CONFIG = " + JSON.stringify(settings) + ";"
    })
  );
  await page.route(/cloudflareinsights\.com|tally\.so/, (route) => route.abort());
}

test.describe("visitor stats", () => {
  test("off by default: no stats script on any page", async ({ page }) => {
    for (const p of ["index.html", "contact.html", "demo/app.html"]) {
      await page.goto(p);
      await expect(page.locator("script[data-obiab-analytics]")).toHaveCount(0);
    }
  });

  test("with a token, the Cloudflare beacon loads with that token", async ({ page }) => {
    await useConfig(page, { cloudflareAnalyticsToken: "test-token-123", analyticsOnLocalhost: true });
    await page.goto("index.html");
    const beacon = page.locator('script[data-obiab-analytics="cloudflare"]');
    await expect(beacon).toHaveCount(1);
    await expect(beacon).toHaveAttribute("src", "https://static.cloudflareinsights.com/beacon.min.js");
    await expect(beacon).toHaveAttribute("data-cf-beacon", '{"token":"test-token-123"}');
  });

  test("not loaded on localhost unless testing is switched on", async ({ page }) => {
    await useConfig(page, { cloudflareAnalyticsToken: "test-token-123" });
    await page.goto("index.html");
    await expect(page.locator("script[data-obiab-analytics]")).toHaveCount(0);
  });

  for (const [label, init] of [
    ["Do Not Track", () => Object.defineProperty(navigator, "doNotTrack", { get: () => "1" })],
    ["Global Privacy Control", () => Object.defineProperty(navigator, "globalPrivacyControl", { get: () => true })]
  ]) {
    test(`visitors with ${label} on are not counted`, async ({ page }) => {
      await page.addInitScript(init);
      await useConfig(page, { cloudflareAnalyticsToken: "test-token-123", analyticsOnLocalhost: true });
      await page.goto("index.html");
      await expect(page.locator("script[data-obiab-analytics]")).toHaveCount(0);
    });
  }
});

test.describe("waitlist form", () => {
  test("with nothing set up, the form falls back to the email app", async ({ page }) => {
    await page.goto("contact.html");
    const form = page.locator("[data-waitlist-form]");
    await expect(form).toHaveAttribute("action", /^mailto:hello@tradiesbureau\.com/);
    await expect(page.locator("[data-waitlist-fallback]")).toBeVisible();
  });

  test("with a Tally form ID, the Tally form is embedded with a backup link", async ({ page }) => {
    await useConfig(page, { tallyFormId: "wAbC12" });
    await page.goto("contact.html");
    await expect(page.locator("[data-waitlist-form]")).toHaveCount(0);
    const frame = page.locator("iframe.waitlist-frame");
    await expect(frame).toHaveAttribute("src", /^https:\/\/tally\.so\/embed\/wAbC12\?/);
    await expect(frame).toHaveAttribute("title", /waitlist/);
    await expect(page.locator('[data-waitlist-fallback] a[href="https://tally.so/r/wAbC12"]')).toBeVisible();
  });

  test("with a form endpoint, the page's own form sends and confirms", async ({ page }) => {
    let sent = null;
    await useConfig(page, { waitlistEndpoint: "http://localhost:4173/__waitlist" });
    await page.route("**/__waitlist", async (route) => {
      sent = JSON.parse(route.request().postData());
      await route.fulfill({ contentType: "application/json", body: '{"ok":true}' });
    });
    await page.goto("contact.html");
    await expect(page.locator("[data-waitlist-fallback]")).toBeHidden();
    await page.fill("#name", "Alex Owner");
    await page.fill("#email", "alex@example.com");
    await page.fill("#suburb", "Example, City of Example");
    await page.selectOption("#stage", "Building now");
    await page.getByRole("button", { name: "Join the waitlist" }).click();
    await expect(page.locator(".waitlist-status.ok")).toHaveText(/You're on the list/);
    expect(sent).toMatchObject({ name: "Alex Owner", email: "alex@example.com", stage: "Building now" });
    expect(sent._subject).toContain("waitlist");
    await expect(page).toHaveURL(/contact\.html$/);
  });

  test("if the form service fails, people are told and given the email address", async ({ page }) => {
    await useConfig(page, { waitlistEndpoint: "http://localhost:4173/__waitlist" });
    await page.route("**/__waitlist", (route) => route.fulfill({ status: 500, body: "" }));
    await page.goto("contact.html");
    await page.fill("#name", "Alex");
    await page.fill("#email", "alex@example.com");
    const button = page.getByRole("button", { name: "Join the waitlist" });
    await button.click();
    await expect(page.locator(".waitlist-status.error")).toContainText("hello@tradiesbureau.com");
    await expect(button).toBeEnabled();
    await expect(page.locator("[data-waitlist-fallback]")).toBeVisible();
  });

  test("the browser checks required fields before anything is sent", async ({ page }) => {
    let calls = 0;
    await useConfig(page, { waitlistEndpoint: "http://localhost:4173/__waitlist" });
    await page.route("**/__waitlist", (route) => {
      calls += 1;
      route.fulfill({ body: "{}" });
    });
    await page.goto("contact.html");
    await page.fill("#name", "Alex");
    await page.fill("#email", "not-an-email");
    await page.getByRole("button", { name: "Join the waitlist" }).click();
    await page.waitForTimeout(300);
    expect(calls).toBe(0);
  });
});

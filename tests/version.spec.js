// Website / app version sync: footer, banners and What's new.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const versions = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "version.json"), "utf8"));

// Serve a different version.json to the page.
async function fakeVersionFile(page, overrides) {
  await page.route("**/version.json", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ ...versions, ...overrides }) })
  );
}

test("footer shows both versions, in sync, linking to What's new", async ({ page }) => {
  await page.goto("index.html");
  const info = page.locator("[data-version-info]");
  await expect(info).toContainText(`Website v${versions.site} · App v${versions.app}`);
  await expect(info.locator("[data-version-state]")).toHaveText("In sync");
  await expect(page.locator("[data-version-banner]")).toHaveCount(0);
  await info.locator("a").click();
  await expect(page).toHaveURL(/changelog\.html$/);
});

test("What's new lists the current version first", async ({ page }) => {
  await page.goto("changelog.html");
  const first = page.locator(".release").first();
  await expect(first).toHaveAttribute("data-version", versions.site);
  await expect(first.locator("h2")).toHaveText(`Website v${versions.site} · App v${versions.app}`);
});

test("an out-of-date page says so up front and offers a refresh", async ({ page }) => {
  await fakeVersionFile(page, { site: "9.9.9" });
  await page.goto("features.html");
  const banner = page.locator('[data-version-banner="stale"]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(`website v${versions.site}`);
  await expect(banner).toContainText("v9.9.9 is live");
  await expect(page.locator("[data-version-state]")).toHaveText("Out of sync");
  await banner.getByRole("button", { name: "Dismiss" }).click();
  await expect(banner).toHaveCount(0);
});

test("mockups that don't match the app version are flagged", async ({ page }) => {
  await fakeVersionFile(page, { app: "9.0.0" });
  await page.goto("demo/app.html");
  const banner = page.locator('[data-version-banner="mismatch"]');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText(`these mockups show app v${versions.app}`);
  await expect(page.locator("[data-version-state]")).toHaveText("Out of sync");
});

test("once the live app publishes its version, a different major.minor is flagged", async ({ page }) => {
  await fakeVersionFile(page, { appVersionUrl: "http://localhost:4173/__live-app-version.json" });
  await page.route("**/__live-app-version.json", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ version: "7.1.0" }) })
  );
  await page.goto("index.html");
  await expect(page.locator('[data-version-banner="mismatch"]')).toContainText("the live app is v7.1.0");
  await expect(page.locator("[data-version-info]")).toContainText("App v7.1.0");
  await expect(page.locator("[data-version-state]")).toHaveText("Out of sync");
});

test("a live app on the same major.minor counts as in sync", async ({ page }) => {
  const [ma, mi] = versions.app.split(".");
  await fakeVersionFile(page, { appVersionUrl: "http://localhost:4173/__live-app-version.json" });
  await page.route("**/__live-app-version.json", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify({ version: `${ma}.${mi}.99` }) })
  );
  await page.goto("index.html");
  await expect(page.locator("[data-version-state]")).toHaveText("In sync");
  await expect(page.locator("[data-version-banner]")).toHaveCount(0);
});

test("if version.json can't be loaded, the page still shows its own version", async ({ page }) => {
  await page.route("**/version.json", (route) => route.fulfill({ status: 404, body: "" }));
  await page.goto("index.html");
  await expect(page.locator("[data-version-info]")).toHaveText(`Website v${versions.site}`);
  await expect(page.locator("[data-version-banner]")).toHaveCount(0);
});

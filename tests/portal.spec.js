// OBIABOX demo portal (portal/index.html): sign in, every screen, the main flows,
// saving, review notes, reset, phone layout and accessibility.
const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const { watchErrors } = require("./helpers");

const ROUTES = ["dashboard", "compliance", "inspections", "trades", "neighbours", "asset", "dilapidation", "documents", "project"];

async function openSample(page) {
  await page.goto("portal/index.html");
  await page.evaluate(() => localStorage.removeItem("obiabox-portal-demo-v1"));
  await page.reload();
  await page.getByRole("button", { name: "Open the sample project" }).click();
  await expect(page.locator("h1")).toContainText(/Good (morning|afternoon|evening), Sam/);
}

async function go(page, route) {
  await page.goto("portal/index.html#/" + route);
  await expect(page.locator(".pt-nav a.on")).toHaveAttribute("data-nav", route);
}

test.describe("demo portal", () => {
  test.beforeEach(async ({ page }) => {
    await openSample(page);
  });

  test("every screen opens without errors", async ({ page }) => {
    const errors = watchErrors(page);
    for (const r of ROUTES) {
      await go(page, r);
      await expect(page.locator("main h1")).toBeVisible();
    }
    expect(errors).toEqual([]);
  });

  test("dashboard: stage, due-next list and footer versions", async ({ page }) => {
    await expect(page.locator("[data-stage]")).toHaveText("Frame");
    await expect(page.locator(".pt-house svg")).toBeAttached();
    await expect(page.locator("[data-due-list] li").first()).toBeVisible();
    await expect(page.locator("[data-version-info]")).toContainText("App v");
    await expect(page.locator(".build-tracker")).toHaveCount(0);
  });

  test("compliance: add an item, update an expiry, and it's saved after a reload", async ({ page }) => {
    await go(page, "compliance");
    const form = page.locator('[data-form="comp-add"]');
    await form.getByLabel("Name").fill("Scaffold hire insurance");
    await form.getByLabel("Type").selectOption("Insurance");
    await form.getByLabel("Expiry date").fill(new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10));
    await form.getByRole("button", { name: "Add" }).click();
    const row = page.locator(".pt-rows li", { hasText: "Scaffold hire insurance" });
    await expect(row).toContainText("Expires in 10 days");

    const owner = page.locator(".pt-rows li", { hasText: "Public liability: owner" });
    await owner.getByRole("button", { name: "Update" }).click();
    await page.locator('[data-form="comp-update"] input[name="expires"]').fill(new Date(Date.now() + 400 * 86400000).toISOString().slice(0, 10));
    await page.locator('[data-form="comp-update"]').getByRole("button", { name: "Save" }).click();
    await expect(page.locator(".pt-rows li", { hasText: "Public liability: owner" })).toContainText("Current to");

    await page.reload();
    await expect(page.locator(".pt-rows li", { hasText: "Scaffold hire insurance" })).toBeVisible();
  });

  test("inspections: upload, book, pass, payment released, stage moves on", async ({ page }) => {
    await go(page, "inspections");
    await expect(page.locator("[data-not-ready]")).toBeVisible();
    await page.getByRole("button", { name: "Upload" }).click();
    await page.locator(".pt-slot").first().click();
    await expect(page.locator("[data-booked]")).toBeVisible();
    await page.getByRole("button", { name: "Passed" }).click();
    await expect(page.locator("[data-toast]")).toContainText("Payment ready to approve: Northside Framing");
    await expect(page.locator(".pt-stagelist li", { hasText: "Frame" })).toHaveClass(/passed/);

    await go(page, "dashboard");
    await expect(page.locator("[data-stage]")).toHaveText("Lock-up");

    await go(page, "trades");
    await page.getByRole("tab", { name: "Contracts" }).click();
    await page.getByRole("button", { name: /Approve payment \$8,975/ }).click();
    await expect(page.locator("[data-toast]")).toContainText("Payment of $8,975");
  });

  test("inspections: defects hold the stage until fixed and re-booked", async ({ page }) => {
    await go(page, "inspections");
    await page.getByRole("button", { name: "Upload" }).click();
    await page.locator(".pt-slot").first().click();
    await page.getByRole("button", { name: "Defects noted" }).click();
    await expect(page.locator(".pt-stagelist li.defect")).toContainText("Re-inspection needed");
    await page.getByRole("button", { name: /Defects fixed/ }).click();
    await expect(page.locator(".pt-slot").first()).toBeVisible();
  });

  test("trades: award a quote creates a contract and adds the trade", async ({ page }) => {
    await go(page, "trades");
    await page.getByRole("tab", { name: "Quotes" }).click();
    await page.locator(".pt-quote", { hasText: "DrySeal Waterproofing" }).getByRole("button", { name: "Award" }).click();
    await expect(page.locator(".pt-quote.awarded")).toContainText("DrySeal Waterproofing");
    await page.getByRole("tab", { name: "Contracts" }).click();
    await expect(page.locator(".pt-card h2", { hasText: "DrySeal Waterproofing" })).toBeVisible();
    await page.getByRole("tab", { name: "Register" }).click();
    await expect(page.locator(".pt-table")).toContainText("DrySeal Waterproofing");
  });

  test("trades: approve a variation updates the revised total", async ({ page }) => {
    await go(page, "trades");
    await page.getByRole("tab", { name: "Contracts" }).click();
    const revised = page.locator('[data-revised="k1"]');
    await expect(revised).toHaveText("$36,750");
    await page.getByRole("button", { name: "Approve +$400" }).click();
    await expect(page.locator('[data-revised="k1"]')).toHaveText("$37,150");
  });

  test("neighbours: send an update and log a letterbox drop", async ({ page }) => {
    await go(page, "neighbours");
    await page.getByRole("button", { name: "Crane", exact: true }).click();
    await expect(page.locator("[data-preview]")).toContainText("Crane truck");
    await page.getByRole("button", { name: "Send to 3 subscribers" }).click();
    await expect(page.locator("[data-toast]")).toContainText("Sent to 3 subscribers");
    await expect(page.locator("[data-update-log] li").first()).toContainText("Crane");

    await expect(page.locator("[data-drop-count]")).toHaveText("6 of 12");
    await page.getByRole("button", { name: "7 Smith St", exact: true }).click();
    await expect(page.locator("[data-drop-count]")).toHaveText("7 of 12");
    await page.getByRole("button", { name: "Log this drop" }).click();
    await expect(page.locator("[data-toast]")).toContainText("Logged 7 of 12");
  });

  test("asset protection: photos then steps through to bond refunded", async ({ page }) => {
    await go(page, "asset");
    const next = page.getByRole("button", { name: /^Next:/ });
    await expect(next).toBeDisabled();
    await page.getByRole("button", { name: "📷 Take photo" }).first().click();
    await page.getByRole("button", { name: "📷 Take photo" }).first().click();
    await expect(next).toBeEnabled();
    for (let i = 0; i < 4; i++) await page.getByRole("button", { name: /^Next:/ }).click();
    await expect(page.locator("[data-bond-done]")).toBeVisible();
  });

  test("dilapidation: uploading a report ticks off a handover document", async ({ page }) => {
    await go(page, "documents");
    const before = await page.locator("[data-handover]").textContent();
    await go(page, "dilapidation");
    await page.locator("tr", { hasText: "14 Smith St" }).getByRole("button", { name: "Upload report" }).click();
    await expect(page.locator("tr", { hasText: "14 Smith St" })).toContainText("Report on file");
    await go(page, "documents");
    await expect(page.locator("[data-handover]")).not.toHaveText(before);
  });

  test("documents: add one, filter by folder and search", async ({ page }) => {
    await go(page, "documents");
    const form = page.locator('[data-form="doc-add"]');
    await form.getByLabel("Name").fill("Plumbing compliance certificate");
    await form.getByLabel("Folder").selectOption("End-of-job certificates");
    await form.getByRole("button", { name: /Add/ }).click();
    await expect(page.locator("[data-doc-list]")).toContainText("Plumbing compliance certificate");
    await page.getByRole("button", { name: /All documents/ }).click();
    await page.getByPlaceholder("Search documents").fill("plans rev");
    await expect(page.locator("[data-doc-list] li")).toHaveCount(2);
    await expect(page.getByPlaceholder("Search documents")).toBeFocused();
    await page.getByPlaceholder("Search documents").fill("zzz");
    await expect(page.locator("[data-docs-empty]")).toBeVisible();
  });

  test("project: share link, export and reset (review notes survive)", async ({ page }) => {
    await go(page, "project");
    await page.getByRole("button", { name: "Create read-only link" }).click();
    await expect(page.locator("[data-share-url]")).toContainText("https://");
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download build file (JSON)" }).click();
    expect((await download).suggestedFilename()).toBe("obiabox-build-file.json");

    await page.getByRole("button", { name: /Review notes/ }).click();
    await page.getByLabel("Your note").fill("Share screen makes sense.");
    await page.getByRole("button", { name: "Add note" }).click();

    await page.keyboard.press("Escape");
    page.once("dialog", (d) => d.accept());
    await page.locator(".pt-demo-bar").getByRole("button", { name: "Reset demo" }).click();
    await expect(page.locator("[data-toast]")).toContainText("Demo reset");
    await expect(page.locator(".pt-notes-btn .pt-badge")).toHaveText("1");
  });

  test("review notes: tagged with the screen, copied and downloaded", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await go(page, "neighbours");
    await page.getByRole("button", { name: /Review notes/ }).click();
    const drawer = page.locator("#pt-notes");
    await expect(drawer).toBeVisible();
    await page.getByLabel("Your note").fill("Would like an SMS preview on the phone.");
    await page.getByRole("button", { name: "Add note" }).click();
    await expect(drawer.locator(".pt-note-list li")).toHaveCount(1);
    await expect(drawer.locator(".pt-note-list li")).toContainText("Neighbours");
    await drawer.getByRole("button", { name: "Copy all" }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("[Neighbours]");
    const download = page.waitForEvent("download");
    await drawer.getByRole("button", { name: "Download (.txt)" }).click();
    expect((await download).suggestedFilename()).toBe("obiabox-review-notes.txt");
    await page.keyboard.press("Escape");
    await expect(drawer).toBeHidden();
    await expect(page.locator(".pt-notes-btn")).toBeFocused();
  });

  test("sign out returns to sign in, and a new blank project can be created", async ({ page }) => {
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Start a new project instead" }).click();
    await page.getByLabel("Street address").fill("5 Test Road");
    await page.getByLabel("Suburb and state").fill("Testville VIC");
    await page.getByLabel("Council").fill("Test Shire");
    await page.getByLabel("Your name").fill("Jo Builder");
    await page.getByRole("button", { name: "Create my project" }).click();
    await expect(page.locator("h1")).toContainText("Jo");
    await expect(page.locator(".pt-top-title")).toContainText("5 Test Road");
    await go(page, "compliance");
    await expect(page.locator(".pt-rows li", { hasText: "Certificate of Consent" })).toContainText("Missing");
  });
});

test("the portal works on a phone with the menu button", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  await openSample(page);
  const menu = page.locator(".pt-menu");
  await expect(menu).toBeVisible();
  await expect(page.locator(".pt-nav")).toBeHidden();
  await menu.click();
  await page.locator(".pt-nav").getByRole("link", { name: /Documents/ }).click();
  await expect(page.locator("h1")).toHaveText("Documents");
  await expect(page.locator(".pt-nav")).toBeHidden();
  for (const r of ROUTES) {
    await page.goto("portal/index.html#/" + r);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }
  await context.close();
});

test("the portal has no automatically detectable accessibility problems", async ({ page }) => {
  await page.goto("portal/index.html");
  await page.evaluate(() => localStorage.removeItem("obiabox-portal-demo-v1"));
  await page.reload();
  const check = async (label) => {
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(r.violations.map((v) => `${label}: ${v.id} → ${v.nodes.map((n) => n.target.join(" ")).slice(0, 3).join(", ")}`)).toEqual([]);
  };
  await check("sign in");
  await page.getByRole("button", { name: "Open the sample project" }).click();
  for (const r of ROUTES) {
    await page.goto("portal/index.html#/" + r);
    await page.waitForTimeout(150);
    await check(r);
  }
  await page.getByRole("button", { name: /Review notes/ }).click();
  await check("review notes");
});

// App mockups (demo/app.html): every interactive screen.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("demo/app.html");
});

test("jump links reach every mockup", async ({ page }) => {
  const ids = await page.$$eval(".mock-jump a", (as) => as.map((a) => a.getAttribute("href").slice(1)));
  expect(ids.length).toBe(11);
  for (const id of ids) await expect(page.locator(`#${id}`)).toBeAttached();
});

test("dashboard draws the build-stage house at frame", async ({ page }) => {
  await expect(page.locator("#dashboard .mock-house svg")).toBeAttached();
  await expect(page.locator("#dashboard .mock-stage-name")).toHaveText("Frame");
});

test("notify neighbours: choosing a message type updates the SMS preview", async ({ page }) => {
  const preview = page.locator("[data-preview-msg]");
  await expect(preview).toContainText("Concrete trucks");
  await page.locator("[data-chips] button", { hasText: "Crane" }).click();
  await expect(preview).toContainText("Crane truck");
  await expect(page.locator("[data-preview-icon]")).toHaveText("🏗");
  await expect(page.locator("[data-chips] button.on")).toHaveText("Crane");
});

test("asset protection: photo sketches are drawn for each asset", async ({ page }) => {
  await expect(page.locator("#asset .mock-photo svg")).toHaveCount(6);
  await expect(page.locator("#asset .mock-photo.todo")).toHaveCount(2);
});

test("dilapidation map: clicking a lot shows its record", async ({ page }) => {
  const title = page.locator("[data-lot-title]");
  await expect(title).toHaveText("14 Smith St");
  await page.locator('rect[data-lot^="3 Back Lane"]').click();
  await expect(title).toHaveText("3 Back Lane (rear)");
  await expect(page.locator("[data-lot-status]")).toContainText("declined access");
  await page.locator('rect[data-lot^="10 Smith"]').focus();
  await page.keyboard.press("Enter");
  await expect(title).toHaveText("10 Smith St");
});

test("trades register: shows every trade and flags missing insurance", async ({ page }) => {
  await expect(page.locator("#trades-register tbody tr")).toHaveCount(7);
  await expect(page.locator("#trades-register")).toContainText("Not provided");
  await expect(page.locator("#trades-register")).not.toContainText("N/A");
});

test("compare quotes: awarding a quote marks it and warns about risky ones", async ({ page }) => {
  const quotes = page.locator("[data-quotes] .mock-quote");
  await quotes.nth(1).getByRole("button").click();
  await expect(quotes.nth(1)).toHaveClass(/awarded/);
  await expect(quotes.nth(0)).toHaveClass(/passed/);
  await expect(page.locator("[data-award-msg]")).toContainText("Awarded to Northside Framing");

  await quotes.nth(2).getByRole("button").click();
  await expect(quotes.nth(2)).toHaveClass(/awarded/);
  await expect(page.locator("[data-award-msg]")).toContainText("proof of insurance");
  await expect(page.locator("[data-award-status]")).toHaveClass(/pill-red/);
});

test("contract admin: approving a variation updates totals and status", async ({ page }) => {
  await expect(page.locator("[data-revised]")).toHaveText("$36,750");
  await page.locator("[data-approve]").click();
  await expect(page.locator("[data-revised]")).toHaveText("$37,150");
  await expect(page.locator("[data-var-total]")).toHaveText("+$1,250");
  await expect(page.locator("[data-var-note]")).toHaveText("Approved in writing today");
  await expect(page.locator("[data-contract-status]")).toHaveText("Up to date");
});

test("contract admin: querying a variation puts it on hold", async ({ page }) => {
  await page.locator("[data-query]").click();
  await expect(page.locator("[data-var-note]")).toContainText("Query sent");
  await expect(page.locator("[data-revised]")).toHaveText("$36,750");
});

test.describe("inspection booking", () => {
  const ready = '[data-step="1"] [data-next="2"]';

  test("can't book until the truss certificate is uploaded", async ({ page }) => {
    await expect(page.locator(ready)).toBeDisabled();
    await page.locator("[data-upload]").click();
    await expect(page.locator(ready)).toBeEnabled();
  });

  test("book, pass, and the frame stage and payment update", async ({ page }) => {
    await page.locator("[data-upload]").click();
    await page.locator(ready).click();
    await page.locator("[data-slots] button", { hasText: "Fri 1:30pm" }).click();
    await page.locator('[data-step="2"] [data-next="3"]').click();
    await expect(page.locator("[data-booked-title]")).toHaveText("Booked: Fri 1:30pm");
    await expect(page.locator("[data-frame-status]")).toHaveText("Booked Fri 1:30pm");
    await page.locator("[data-pass]").click();
    await expect(page.locator("[data-outcome]")).toContainText("Frame inspection passed");
    await expect(page.locator("[data-frame-stage]")).toHaveClass(/passed/);
  });

  test("defects hold the payment, and Start again resets everything", async ({ page }) => {
    await page.locator("[data-upload]").click();
    await page.locator(ready).click();
    await page.locator('[data-step="2"] [data-next="3"]').click();
    await page.locator("[data-defects]").click();
    await expect(page.locator("[data-outcome]")).toContainText("2 defects noted");
    await expect(page.locator("[data-frame-status]")).toHaveText("Re-inspection needed");

    await page.locator("[data-reset]").click();
    await expect(page.locator("[data-frame-status]")).toHaveText("Ready to book");
    await expect(page.locator(ready)).toBeDisabled();
    await page.locator("[data-upload]").click();
    await expect(page.locator(ready)).toBeEnabled();
  });
});

test.describe("document vault", () => {
  const docs = "[data-docs] li";

  test("filters, search and folders narrow the list", async ({ page }) => {
    await expect(page.locator(docs)).toHaveCount(26);
    await expect(page.locator("[data-share-panel]")).toBeHidden();
    await page.locator('[data-filter="missing"]').click();
    await expect(page.locator(docs)).toHaveCount(6);
    await page.locator('[data-filter="warn"]').click();
    await expect(page.locator(docs)).toHaveCount(1);
    await page.locator('[data-filter="all"]').click();
    await page.fill("[data-vault-search]", "dilap");
    await expect(page.locator(docs)).toHaveCount(2);
    await page.fill("[data-vault-search]", "nothing like this");
    await expect(page.locator(docs)).toHaveCount(0);
    await expect(page.locator("[data-docs-empty]")).toBeVisible();
    await page.fill("[data-vault-search]", "");
    await page.locator("[data-folders] button", { hasText: "End-of-job certificates" }).click();
    await expect(page.locator(docs)).toHaveCount(3);
  });

  test("snapping a document files it and fills a handover gap", async ({ page }) => {
    await expect(page.locator("[data-hand-count]")).toHaveText("16 of 21");
    await page.locator("[data-snap]").click();
    await expect(page.locator("[data-hand-count]")).toHaveText("17 of 21");
    await expect(page.locator(`${docs}.fresh`)).toContainText("Plumbing compliance certificate");
    await expect(page.locator("[data-vault-toast]")).toContainText("Flowright Plumbing");
    await page.locator("[data-snap]").click();
    await page.locator("[data-snap]").click();
    await expect(page.locator("[data-vault-toast]")).toContainText("all the sample documents");
  });

  test("share opens the panel and links to the surveyor's view", async ({ page }) => {
    await page.locator("[data-share]").click();
    const panel = page.locator("[data-share-panel]");
    await expect(panel).toBeVisible();
    await expect(panel.locator("a")).toHaveAttribute("href", "#surveyor");
    await page.locator("[data-copy]").click();
    await expect(panel).toBeHidden();
    await expect(page.locator("[data-vault-toast]")).toContainText("read-only");
  });
});

test.describe("letterbox drop map", () => {
  const count = "[data-drop-count]";
  const lot = (addr) => `.drop-lot[aria-label^="${addr}"]`;

  test("tapping houses marks them dropped and logs the drop", async ({ page }) => {
    await expect(page.locator(count)).toHaveText("6 of 12");
    await page.locator(lot("9 Smith")).click();
    await expect(page.locator(count)).toHaveText("7 of 12");
    await page.locator(lot("9 Smith")).click();
    await expect(page.locator(count)).toHaveText("6 of 12");
    await page.locator("[data-drop-finish]").click();
    await expect(page.locator("[data-drop-toast]")).toContainText("Logged 6 of 12");
  });

  test("houses outside the area can't be ticked until you widen it", async ({ page }) => {
    await page.locator(lot("17 Smith")).click();
    await expect(page.locator("[data-drop-toast]")).toContainText("isn't in this drop");
    await page.locator('[data-area="wide"]').click();
    await expect(page.locator(count)).toHaveText("6 of 14");
    await page.locator(lot("17 Smith")).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(count)).toHaveText("7 of 14");
  });

  test("finishing the smallest area logs a complete drop", async ({ page }) => {
    await page.locator('[data-area="next"]').click();
    await expect(page.locator(count)).toHaveText("3 of 5");
    await page.locator(lot("13 Smith")).click();
    await page.locator(lot("3 Back")).click();
    await expect(page.locator(count)).toHaveText("5 of 5");
    await expect(page.locator("[data-drop-finish]")).toHaveText("Log this drop ✓");
    await page.locator("[data-drop-finish]").click();
    await expect(page.locator("[data-drop-toast]")).toContainText("proof you gave notice");
    await expect(page.locator("[data-sub-count]")).toHaveText("3");
  });
});

test.describe("surveyor's view", () => {
  test("opening a document shows its preview", async ({ page }) => {
    await page.locator("[data-sv-docs] button", { hasText: "Structural engineering" }).click();
    await expect(page.locator("[data-sv-doc]")).toHaveText("Structural engineering");
    await expect(page.locator("[data-sv-docs] button.on")).toContainText("Structural engineering");
  });

  test("requesting a document adds it once and notifies the owner", async ({ page }) => {
    const bracing = page.locator("[data-sv-request] button", { hasText: "Bracing layout" });
    await bracing.click();
    await expect(bracing).toBeDisabled();
    await expect(page.locator("[data-sv-requests] li")).toHaveCount(1);
    await expect(page.locator("[data-sv-requests]")).toContainText("Sam notified");
  });

  test("notes send with the button or Enter, and empty notes are ignored", async ({ page }) => {
    const thread = page.locator("[data-sv-thread] li");
    await expect(thread).toHaveCount(1);
    await page.locator("[data-sv-send]").click();
    await expect(thread).toHaveCount(2);
    await page.locator("[data-sv-send]").click();
    await expect(thread).toHaveCount(2);
    await page.fill("[data-sv-input]", "Back by 3pm.");
    await page.press("[data-sv-input]", "Enter");
    await expect(thread).toHaveCount(3);
    await expect(thread.last()).toContainText("Back by 3pm.");
  });
});

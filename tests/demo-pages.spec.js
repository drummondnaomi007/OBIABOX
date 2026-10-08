// Sample letterbox notice and sample neighbour page.
const { test, expect } = require("@playwright/test");

test("letterbox notice has a print button and prints without the site around it", async ({ page }) => {
  await page.goto("demo/notice.html");
  let printed = false;
  await page.exposeFunction("markPrinted", () => {
    printed = true;
  });
  await page.evaluate(() => {
    window.print = () => window.markPrinted();
  });
  await page.getByRole("button", { name: "Print this notice" }).click();
  await expect.poll(() => printed).toBe(true);

  await page.emulateMedia({ media: "print" });
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
  await expect(page.locator(".notice-sheet")).toBeVisible();
  await expect(page.locator(".notice-sheet h1")).toContainText("12 Smith Street");
});

test("neighbour sign-up form shows the demo message instead of sending", async ({ page }) => {
  await page.goto("demo/project.html");
  const msg = page.locator(".demo-msg");
  await expect(msg).toBeHidden();
  await page.fill("#nb-name", "Alex");
  await page.fill("#nb-address", "10 Smith St");
  await page.fill("#nb-contact", "0400 111 222");
  await page.getByRole("button", { name: "Keep me posted" }).click();
  await expect(msg).toBeVisible();
  await expect(page).toHaveURL(/demo\/project\.html/);
});

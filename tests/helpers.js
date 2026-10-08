// Shared helpers for the OBIAB browser tests.
const { expect } = require("@playwright/test");

const PAGES = [
  "index.html",
  "features.html",
  "neighbours.html",
  "guides.html",
  "about.html",
  "contact.html",
  "demo/notice.html",
  "demo/project.html",
  "demo/app.html"
];

// Collect console errors, uncaught exceptions and failed local requests.
function watchErrors(page) {
  const errors = [];
  page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`console: ${m.text()}`);
  });
  page.on("requestfailed", (r) => {
    if (r.url().startsWith("http://localhost")) errors.push(`requestfailed: ${r.url()}`);
  });
  return errors;
}

// Jump (not smooth-scroll) to a fraction of the page height.
async function scrollToFraction(page, f) {
  await page.evaluate((frac) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: max * frac, behavior: "instant" });
  }, f);
  // The tracker updates on the next animation frame.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
}

async function expectNoSidewaysScroll(page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth
  }));
  expect(scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(innerWidth);
}

module.exports = { PAGES, watchErrors, scrollToFraction, expectNoSidewaysScroll };

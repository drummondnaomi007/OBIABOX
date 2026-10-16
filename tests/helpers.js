// Shared helpers for the OBIAB browser tests.
const { expect } = require("@playwright/test");

// Pages that make up the house build (must match PAGES in js/house.js).
const PAGES = [
  "index.html",
  "features.html",
  "neighbours.html",
  "guides.html",
  "faq.html",
  "about.html",
  "contact.html",
  "demo/notice.html",
  "demo/project.html",
  "demo/app.html"
];

// Every page on the site.
const ALL_PAGES = PAGES.concat(["privacy.html", "changelog.html", "404.html"]);

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
  const screenWidth = page.viewportSize().width;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth, "page scrolls sideways").toBeLessThanOrEqual(screenWidth);
}

// Nothing on the page pokes past the right edge of the screen, even where a
// parent clips it (which wouldn't show up as sideways scrolling).
async function expectNothingOffScreen(page) {
  // Use the configured screen width: phone emulation zooms out to fit content
  // that's too wide, which would hide the problem from window.innerWidth.
  const screenWidth = page.viewportSize().width;
  const offenders = await page.evaluate((width) => {
    const limit = width + 1;
    const out = [];
    for (const el of document.querySelectorAll("main *")) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.right <= limit) continue;
      // Skip things inside a deliberate scroll box or decorative clipped art.
      let parent = el.parentElement;
      let clippedOnPurpose = el.closest("svg, .hero-house") !== null;
      while (!clippedOnPurpose && parent && parent.tagName !== "MAIN") {
        const ox = getComputedStyle(parent).overflowX;
        if (ox === "auto" || ox === "scroll") clippedOnPurpose = true;
        parent = parent.parentElement;
      }
      if (!clippedOnPurpose) out.push(`${el.tagName.toLowerCase()}.${el.className} ends at ${Math.round(r.right)}px`);
    }
    return out.slice(0, 5);
  }, screenWidth);
  expect(offenders, "content runs off the right edge of the screen").toEqual([]);
}

module.exports = { PAGES, ALL_PAGES, expectNothingOffScreen, watchErrors, scrollToFraction, expectNoSidewaysScroll };

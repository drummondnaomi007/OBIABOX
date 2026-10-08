// Browser tests for the OBIAB site. Run with: npm test
// The config starts a local static server (python3 -m http.server) for you.
const { defineConfig } = require("@playwright/test");

const PORT = 4173;

module.exports = defineConfig({
  testDir: "tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}/`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure"
  },
  projects: [
    {
      name: "desktop",
      use: { browserName: "chromium", viewport: { width: 1280, height: 900 } }
    },
    {
      // Phone width: layout checks only.
      name: "mobile",
      testMatch: /layout\.spec\.js/,
      use: { browserName: "chromium", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }
    }
  ],
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    stdout: "ignore",
    stderr: "ignore"
  }
});

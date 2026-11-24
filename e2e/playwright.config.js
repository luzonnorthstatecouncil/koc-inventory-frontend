// E2E against the isolated stack: frontend :5174 (proxying /api) -> backend :5055 -> DB pos_inventory_e2e
const { defineConfig } = require("@playwright/test");
module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1, // phases share one database; keep them ordered
  retries: 0,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5174",
    headless: true,
    viewport: { width: 1440, height: 900 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  outputDir: "./results",
});

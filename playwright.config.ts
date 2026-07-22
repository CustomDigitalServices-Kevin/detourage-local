import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // The real-inference proof runs under playwright.inference.config.ts (dev
  // server + self-hosted model), so keep it out of the default preview run.
  testIgnore: "inference.spec.ts",
  fullyParallel: true,
  retries: process.env["CI"] === undefined ? 0 : 1,
  use: {
    baseURL: "http://localhost:4173",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: process.env["CI"] === undefined,
  },
});

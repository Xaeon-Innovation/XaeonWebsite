import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for the public site against a mock API (e2e/mock-api.mjs).
 * Build first with the mock as the API: `npm run build:e2e`, then `npm run e2e`.
 */
const PORT = 3100;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 2,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 13"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],
  webServer: [
    { command: "node e2e/mock-api.mjs", url: "http://127.0.0.1:4010/__requests", reuseExistingServer: true },
    {
      command: `npx next start -p ${PORT}`,
      url: `http://127.0.0.1:${PORT}/robots.txt`,
      reuseExistingServer: !process.env.CI,
      env: { API_ORIGIN: "http://127.0.0.1:4010", NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});

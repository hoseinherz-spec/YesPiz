import { defineConfig } from "@playwright/test";

export const app = (workspace: string, port: number) => ({
  command: `npm run dev --workspace=${workspace} -- --webpack --port ${port}`,
  url: `http://localhost:${port}/login/`,
  timeout: 180_000,
  reuseExistingServer: false,
  env: {
    NEXT_DISABLE_WEBPACK_CACHE: "1",
    NEXT_PUBLIC_API_URL: "http://localhost:8158",
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "",
  },
});

export default defineConfig({
  testDir: "./e2e",
  testMatch: "order-flow.spec.ts",
  timeout: 180_000,
  expect: { timeout: 20_000 },
  workers: 1,
  use: {
    actionTimeout: 20000,
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    trace: process.env.PLAYWRIGHT_TRACE === "1" ? "retain-on-failure" : "off",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run build --workspace=@repo/i18n && node e2e/start-api.cjs",
      url: "http://localhost:8158/api/v1",
      timeout: 120_000,
    },
    app("mobile", 8151),
    app("provider-panel", 8184),
    app("courier-mobile", 8153),
  ],
});

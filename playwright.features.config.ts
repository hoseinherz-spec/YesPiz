import { defineConfig } from "@playwright/test";
import { app } from "./playwright.config";
export default defineConfig({
  testDir: "./e2e",
  testMatch: "features.spec.ts",
  timeout: 300000,
  expect: { timeout: 20000 },
  workers: 1,
  use: {
    browserName: "chromium",
    channel: process.env.CI ? undefined : "chrome",
    actionTimeout: 20000,
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "npm run build --workspace=@repo/i18n && node e2e/start-api.cjs",
      url: "http://localhost:8158/api/v1",
      timeout: 120000,
      env: {
        YESPIZZ_FEATURE_TEST: "1",
        NODE_OPTIONS: "--max-old-space-size=512",
      },
    },
    ...[app("mobile", 8151), app("admin", 8152)]
      .filter(
        (server) =>
          !process.env.YESPIZZ_FEATURE_SURFACE ||
          server.command.includes(
            `--workspace=${process.env.YESPIZZ_FEATURE_SURFACE}`,
          ),
      )
      .map((server) => ({
        ...server,
        env: {
          ...server.env,
          YESPIZZ_E2E_OUTPUT: "1",
          NODE_OPTIONS: "--max-old-space-size=2048",
        },
      })),
  ],
});

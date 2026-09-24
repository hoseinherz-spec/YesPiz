import { defineConfig } from "@playwright/test";
import base, { app } from "./playwright.config";

/** Uses the already-running disposable API and exercises all three user roles. */
export default defineConfig({
  ...base,
  testMatch: "order-flow.spec.ts",
  outputDir: ".qa/demo-flow-results",
  workers: 1,
  webServer: [
    {
      ...app("mobile", 8151),
      reuseExistingServer: true,
    },
  ],
});

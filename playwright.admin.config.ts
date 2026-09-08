import { defineConfig } from "@playwright/test";
import base, { app } from "./playwright.config";
export default defineConfig({
  ...base,
  testMatch: ["admin-flow.spec.ts", "menu-management.spec.ts"],
  webServer: [
    {
      command: "npm run build --workspace=@repo/i18n && node e2e/start-api.cjs",
      url: "http://localhost:8158/api/v1",
      timeout: 120000,
    },
    app("admin", 8152),
    app("courier-mobile", 8153),
  ],
});

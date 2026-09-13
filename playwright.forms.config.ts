import { defineConfig } from "@playwright/test";
import features from "./playwright.features.config";

export default defineConfig({
  ...features,
  testMatch: "menu-management.spec.ts",
  webServer: Array.isArray(features.webServer)
    ? features.webServer.filter(
        (server) => !server.command?.includes("--workspace=mobile"),
      )
    : features.webServer,
});

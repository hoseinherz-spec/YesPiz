import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "checkout-accessibility.spec.ts",
  timeout: 180_000,
});

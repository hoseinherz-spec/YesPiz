import { defineConfig } from "@playwright/test";
import { readFileSync } from "node:fs";
import { parseEnv } from "node:util";
import base, { app } from "./playwright.config";
const publicKey = parseEnv(
  readFileSync("apps/mobile/.env.local", "utf8"),
).NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
if (!publicKey?.startsWith("pk_test_"))
  throw new Error("Configure the matching sandbox public key first.");
const customer = app("mobile", 8151);
export default defineConfig({
  ...base,
  testMatch: "stripe-checkout.spec.ts",
  use: { ...base.use, trace: "off" },
  webServer: [
    {
      command: "npm run build --workspace=@repo/i18n && node e2e/start-api.cjs",
      url: "http://localhost:8158/api/v1",
      timeout: 180000,
      env: { TEST_STRIPE_SANDBOX: "1" },
    },
    {
      ...customer,
      env: { ...customer.env, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: publicKey },
    },
  ],
});

import { defineConfig } from "@playwright/test";
import base, { app } from "./playwright.config";

export default defineConfig({
  ...base,
  testMatch: "role-review.spec.ts",
  outputDir: ".qa/review-test-results",
  timeout: 360_000,
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile: `.qa/role-review-${process.env.YESPIZZ_REVIEW_SURFACE || "all"}-results.json`,
      },
    ],
  ],
  webServer: [
    ...(Array.isArray(base.webServer) ? base.webServer : []),
    app("admin", 8152),
    app("provider-panel", 8184),
    app("courier-mobile", 8153),
    { ...app("website", 8150), url: "http://localhost:8150" },
  ]
    .filter((server) => {
      const surface = process.env.YESPIZZ_REVIEW_SURFACE;
      if (!surface || server.command.includes("start-api")) return true;
      const surfaces =
        surface === "visitor" ? ["website", "mobile"] : [surface];
      return surfaces.some((name) =>
        server.command.includes(`--workspace=${name} `),
      );
    })
    .map((server) => ({
      ...server,
      reuseExistingServer: process.env.YESPIZZ_REVIEW_REUSE === "1",
      timeout: 240_000,
    })),
});

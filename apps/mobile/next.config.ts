import type { NextConfig } from "next";
import { withI18n } from "@repo/i18n/plugin";

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["@repo/icons"] },
  distDir: process.env.YESPIZZ_E2E_OUTPUT === "1" ? ".next-e2e" : ".next",
  webpack: (config) => {
    if (process.env.NEXT_DISABLE_WEBPACK_CACHE === "1") config.cache = false;
    return config;
  },
  transpilePackages: [
    "@repo/i18n",
    "@repo/theme",
    "@repo/api",
    "@repo/ui",
    "@repo/native-stripe",
  ],
  // Static export for Capacitor (APK / AAB / iOS)
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default withI18n("./src/i18n/request.ts")(nextConfig);

// Capacitor consumes the static `out/` directory from `next build`.

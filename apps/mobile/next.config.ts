import type { NextConfig } from "next";
import { withI18n } from "@repo/i18n/plugin";

const nextConfig: NextConfig = {
  webpack: (config) => {
    if (process.env.NEXT_DISABLE_WEBPACK_CACHE === "1") config.cache = false;
    return config;
  },
  transpilePackages: ["@repo/i18n", "@repo/theme", "@repo/api", "@repo/ui"],
  // Static export for Capacitor (APK / AAB / iOS)
  output: "export",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default withI18n("./src/i18n/request.ts")(nextConfig);

// Capacitor consumes the static `out/` directory from `next build`.

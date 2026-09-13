import type { NextConfig } from 'next';
import { withI18n } from '@repo/i18n/plugin';

const nextConfig: NextConfig = {
  experimental: { optimizePackageImports: ["@repo/icons"] },
  distDir: process.env.YESPIZZ_E2E_OUTPUT === "1" ? ".next-e2e" : ".next",
  transpilePackages: ['@repo/i18n', '@repo/theme', '@repo/api', '@repo/ui'],
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default withI18n('./src/i18n/request.ts')(nextConfig);

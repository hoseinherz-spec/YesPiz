import type { NextConfig } from 'next';
import { withI18n } from '@repo/i18n/plugin';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/i18n', '@repo/theme', '@repo/api', '@repo/ui'],
  // Static export for Capacitor (APK / AAB / iOS)
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};

export default withI18n('./src/i18n/request.ts')(nextConfig);

// Capacitor consumes the static `out/` directory from `next build`.

import type { NextConfig } from 'next';
import { withI18n } from '@repo/i18n/plugin';

const nextConfig: NextConfig = {
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

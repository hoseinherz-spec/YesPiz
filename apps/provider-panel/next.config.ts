import type { NextConfig } from 'next';
import { withI18n } from '@repo/i18n/plugin';

const nextConfig: NextConfig = {
  transpilePackages: ['@repo/i18n', '@repo/theme', '@repo/api', '@repo/ui'],
};

export default withI18n('./src/i18n/request.ts')(nextConfig);

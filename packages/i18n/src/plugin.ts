import createNextIntlPlugin from 'next-intl/plugin';

/**
 * Creates the next-intl Next.js plugin without locale routing / middleware.
 * Point `requestPath` at your app's request config (or the shared package export).
 */
export function withI18n(requestPath = './src/i18n/request.ts') {
  return createNextIntlPlugin(requestPath);
}

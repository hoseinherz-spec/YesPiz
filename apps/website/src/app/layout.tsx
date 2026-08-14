import { Poppins } from 'next/font/google';
import { NextIntlClientProvider } from '@repo/i18n';
import { getLocale } from '@repo/i18n/server';
import type { ReactNode } from 'react';
import { JsonLd } from '@/components/seo/json-ld';
import { createSiteMetadata, createSiteViewport } from '@/lib/seo';
import { Providers } from './providers';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-poppins-family',
  display: 'swap',
});

export const metadata = createSiteMetadata();
export const viewport = createSiteViewport();

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

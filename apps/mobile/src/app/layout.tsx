import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import { NextIntlClientProvider, defaultLocale, getMessages } from '@repo/i18n';
import type { ReactNode } from 'react';

import { Providers } from './providers';
import './globals.css';

const poppins = Poppins({
  variable: '--font-poppins',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'YesPiz',
  description: 'Premium pizza, delivered',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#08111F',
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const messages = await getMessages(defaultLocale);

  return (
    <html
      lang={defaultLocale}
      className={`${poppins.variable} dark h-full antialiased`}
      data-theme="dark"
      suppressHydrationWarning
    >
      <body className="bg-[#08111F] text-white min-h-full flex flex-col font-sans select-none">
        <NextIntlClientProvider locale={defaultLocale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from 'next';
import { poppins } from '@repo/theme/fonts';
import { NextIntlClientProvider, defaultLocale, getMessages } from '@repo/i18n';
import type { ReactNode } from 'react';

import { Providers } from './providers';
import './globals.css';
import '@/features/cart/components/basket-motion.css';
import '@repo/ui/mobile-transitions.css';
import '@/components/motion/food-flow.css';

export const metadata: Metadata = {
  title: 'YesPiz',
  description: 'Premium pizza, delivered',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#031126',
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
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans select-none">
        <NextIntlClientProvider locale={defaultLocale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

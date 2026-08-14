import { NextIntlClientProvider } from 'next-intl';
import type { ReactNode } from 'react';

type I18nProviderProps = {
  children: ReactNode;
  locale?: string;
  messages?: Record<string, unknown>;
};

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

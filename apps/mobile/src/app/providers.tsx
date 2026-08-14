'use client';

import { ApiQueryProvider } from '@repo/api';
import { ThemeProvider } from '@repo/theme';
import type { ReactNode } from 'react';

import { AppProvider } from '@/context/AppContext';
import { CartProvider } from '@/context/CartContext';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ApiQueryProvider>
        <AppProvider>
          <CartProvider>{children}</CartProvider>
        </AppProvider>
      </ApiQueryProvider>
    </ThemeProvider>
  );
}

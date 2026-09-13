'use client';

import { ApiQueryProvider } from '@repo/api';
import { ThemeProvider } from '@repo/theme';
import { MobilePageTransition } from "@repo/ui/mobile-page-transition";
import { usePathname } from "next/navigation";
import type { ReactNode } from 'react';

import { AppProvider } from '@/context/AppContext';
import { CartProvider } from '@/context/CartContext';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ApiQueryProvider>
        <AppProvider>
          <CartProvider>
            <MobilePageTransition pathname={pathname} app="customer">{children}</MobilePageTransition>
          </CartProvider>
        </AppProvider>
      </ApiQueryProvider>
    </ThemeProvider>
  );
}

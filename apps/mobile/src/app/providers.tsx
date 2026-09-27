'use client';

import { ApiQueryProvider } from '@repo/api';
import { ThemeProvider } from '@repo/theme';
import { MobilePageTransition } from "@repo/ui/mobile-page-transition";
import { Toast } from "@heroui/react";
import { usePathname } from "next/navigation";
import { Suspense, type ReactNode } from 'react';

import { OrderPushNavigation } from "@/features/tracking/OrderPushNavigation";
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
          <OrderPushNavigation />
          <CartProvider>
            {/* A persistent boundary keeps the source image mounted while detail suspends. */}
            <Suspense fallback={<div role="status" aria-busy="true">Loading…</div>}>
              <MobilePageTransition pathname={pathname} app="customer">{children}</MobilePageTransition>
            </Suspense>
            <Toast.Provider placement="top" maxVisibleToasts={3} />
          </CartProvider>
        </AppProvider>
      </ApiQueryProvider>
    </ThemeProvider>
  );
}

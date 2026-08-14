'use client';

import { ApiQueryProvider } from '@repo/api';
import { ThemeProvider } from '@repo/theme';
import type { ReactNode } from 'react';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ApiQueryProvider>{children}</ApiQueryProvider>
    </ThemeProvider>
  );
}

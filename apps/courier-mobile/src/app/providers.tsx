"use client";
import { LocationSharing } from "@/components/LocationSharing";

import { ApiQueryProvider } from "@repo/api";
import { ThemeProvider } from "@repo/theme";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ApiQueryProvider>
        <LocationSharing />
        {children}
      </ApiQueryProvider>
    </ThemeProvider>
  );
}

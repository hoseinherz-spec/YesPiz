"use client";

import { ApiQueryProvider } from "@repo/api";
import { ThemeProvider } from "@repo/theme";
import { MobilePageTransition } from "@repo/ui/mobile-page-transition";
import { usePathname } from "next/navigation";
import "@repo/ui/mobile-transitions.css";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <ApiQueryProvider>
        <MobilePageTransition pathname={pathname} app="admin">
          {children}
        </MobilePageTransition>
      </ApiQueryProvider>
    </ThemeProvider>
  );
}

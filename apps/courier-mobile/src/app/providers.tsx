"use client";
import { LocationSharing } from "@/components/LocationSharing";

import { ApiQueryProvider } from "@repo/api";
import { ThemeProvider } from "@repo/theme";
import { MobilePageTransition } from "@repo/ui/mobile-page-transition";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  const pathname = usePathname();
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <ApiQueryProvider>
        <LocationSharing />
        <MobilePageTransition pathname={pathname} app="courier">{children}</MobilePageTransition>
      </ApiQueryProvider>
    </ThemeProvider>
  );
}

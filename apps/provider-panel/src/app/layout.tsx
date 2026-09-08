import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { NextIntlClientProvider } from "@repo/i18n";
import { getLocale } from "@repo/i18n/server";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Yespizz Provider",
  description: "Yespizz provider panel",
};

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground min-h-full flex flex-col">
        <NextIntlClientProvider>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

"use client";

import { Button, Typography } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { clearAdminToken } from "@/lib/auth";

const NAV = [
  { href: "/couriers", label: "Courier shifts" },
  { href: "/refunds", label: "Refunds" },
  { href: "/menu", label: "Menu" },
  { href: "/providers", label: "Providers" },
  { href: "/quality", label: "Quality" },
  { href: "/incidents", label: "Incidents" },
  { href: "/live", label: "Live ops" },
  { href: "/config", label: "Config" },
  { href: "/exceptions", label: "Exceptions" },
] as const;

export function OpsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="border-border bg-card flex w-full shrink-0 flex-col gap-5 border-b p-5 md:w-64 md:border-b-0 md:border-r">
        <div>
          <Typography type="h3" className="text-lg font-semibold">
            YesPiz Admin
          </Typography>
          <p className="text-muted text-sm">Operations</p>
        </div>
        <nav className="flex flex-row flex-wrap gap-2 md:flex-col">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                href={item.href}
                className={`rounded-full px-4 py-3 text-sm font-medium transition-colors ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:opacity-80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto">
          <Button
            variant="secondary"
            size="sm"
            onPress={() => {
              clearAdminToken();
              router.replace("/login");
            }}
          >
            Log out
          </Button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}

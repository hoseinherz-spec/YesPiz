"use client";
import { providersClient } from "@repo/api";
import { Notifications } from "@repo/api/components/notifications";
import { getProviderToken } from "@/lib/auth";

import { Button, Typography } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearProviderToken } from "@/lib/auth";

const NAV = [
  { href: "/offers", label: "Offers" },
  { href: "/kitchen", label: "Kitchen" },
  { href: "/operations", label: "Operations" },
  { href: "/batches", label: "Batches" },
] as const;

export function ProviderShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [kitchenName, setKitchenName] = useState("Kitchen workspace");
  useEffect(() => {
    let active = true;
    const token = getProviderToken();
    if (token)
      void providersClient
        .getMeProfile({ accessToken: token })
        .then((profile) => {
          if (active) setKitchenName(profile.name);
        })
        .catch(() => {
          if (active) setKitchenName("Kitchen profile unavailable");
        });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-border bg-card flex flex-wrap items-center justify-between gap-4 border-b px-5 py-5">
        <div>
          <Typography type="h3" className="text-lg font-semibold">
            YesPiz Kitchen
          </Typography>
          <p className="text-muted text-xs">{kitchenName}</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                href={item.href}
                className={`rounded-full px-4 py-3 text-sm font-medium ${
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-foreground hover:opacity-80"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          <Button
            size="sm"
            variant="secondary"
            onPress={() => {
              clearProviderToken();
              router.replace("/login");
            }}
          >
            Log out
          </Button>
        </nav>
      </header>
      <main className="min-w-0 flex-1 p-4 md:p-8">
        <Notifications accessToken={getProviderToken()} />
        {children}
      </main>
    </div>
  );
}

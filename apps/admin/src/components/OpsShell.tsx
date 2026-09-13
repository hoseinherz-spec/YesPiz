"use client";

import { Button, Typography } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { clearAdminToken } from "@/lib/auth";

const NAV = [
  { href: "/growth", label: "Marketing" },
  { href: "/tasks", label: "Team tasks" },
  { href: "/finance", label: "Partner finance" },
  { href: "/support", label: "Customer care" },
  { href: "/feedback", label: "Private feedback" },
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
  const navigation = useRef<HTMLElement>(null);
  useEffect(() => {
    const nav = navigation.current;
    if (!nav) return;
    const revealActive = () => {
      const active = nav.querySelector<HTMLElement>('[aria-current="page"]');
      if (active)
        nav.scrollLeft =
          active.offsetLeft -
          nav.offsetLeft -
          (nav.clientWidth - active.clientWidth) / 2;
    };
    revealActive();
    const observer = new ResizeObserver(revealActive);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a className="panel-skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="panel-sidebar border-border bg-card flex w-full shrink-0 flex-col gap-5 border-b p-5 md:w-64 md:border-b-0 md:border-r">
        <div>
          <Typography type="h3" className="text-lg font-semibold">
            YesPiz Admin
          </Typography>
          <p className="text-muted text-sm">Operations</p>
        </div>
        <nav
          ref={navigation}
          aria-label="Operations"
          className="panel-navigation flex flex-row gap-2 md:flex-col"
        >
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
      <main
        id="main-content"
        tabIndex={-1}
        className="panel-main min-w-0 flex-1 p-4 md:p-8"
      >
        {children}
      </main>
    </div>
  );
}

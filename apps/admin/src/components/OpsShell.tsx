"use client";

import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import { Button, Typography } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { clearAdminToken } from "@/lib/auth";

const NAV = [
  { href: "/order-tools", label: "Order operations" },
  { href: "/cash", label: "Cash reconciliation" },
  { href: "/team-access", label: "Team access" },
  { href: "/inventory", label: "Kitchen stock" },
  { href: "/insights", label: "Service & growth" },
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
  const [permissions, setPermissions] = useState<string[] | undefined | null>(
    null,
  );
  const [accessError, setAccessError] = useState("");
  useEffect(() => {
    let active = true;
    void apiRequest<{ adminPermissions?: string[] }>(
      "/api/v1/account/profile/me",
      withAuth({ accessToken: requireAdminToken(), method: "GET" }),
    )
      .then((profile) => {
        if (active) {
          setPermissions(profile.adminPermissions);
          setAccessError("");
        }
      })
      .catch(() => {
        if (active)
          setAccessError("Unable to load team access. Refresh to try again.");
      });
    return () => {
      active = false;
    };
  }, [pathname]);
  const areaByPath: Record<string, string> = {
    "/order-tools": "operations",
    "/cash": "finance",
    "/inventory": "operations",
    "/insights": "operations",
    "/growth": "growth",
    "/finance": "finance",
    "/support": "support",
    "/feedback": "support",
    "/couriers": "operations",
    "/refunds": "finance",
    "/menu": "catalog",
    "/providers": "operations",
    "/quality": "operations",
    "/incidents": "operations",
    "/live": "operations",
    "/exceptions": "operations",
  };
  const availableNav = NAV.filter(
    (item) =>
      permissions === undefined ||
      (permissions !== null &&
        permissions.includes(`${areaByPath[item.href]}:read`)),
  );
  const currentAllowed =
    permissions === undefined ||
    availableNav.some(
      (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
    );

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
          {availableNav.map((item) => {
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
        {accessError ? (
          <p role="alert" className="text-danger">
            {accessError}
          </p>
        ) : permissions === null ? (
          <p role="status">Loading team access…</p>
        ) : currentAllowed ? (
          children
        ) : (
          <section className="rounded-3xl border border-border p-6">
            <h1 className="text-xl font-semibold">
              Choose an available workspace
            </h1>
            <p className="mt-3 text-sm text-muted">
              {availableNav.length
                ? "Use the navigation to open an area assigned to you."
                : "No areas are assigned yet. Ask a full administrator to update your team access."}
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

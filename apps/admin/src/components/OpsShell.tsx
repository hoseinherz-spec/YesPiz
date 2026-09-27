"use client";
import { AppearanceToggle } from "@repo/theme";
import Image from "next/image";

import { apiRequest, withAuth } from "@repo/api";
import { requireAdminToken } from "@/lib/auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearAdminToken } from "@/lib/auth";
import {
  Gauge,
  ClipboardList,
  TriangleAlert,
  Flag,
  Store,
  Bike,
  PackageSearch,
  BadgeCheck,
  UtensilsCrossed,
  Megaphone,
  ChartLine,
  Headset,
  MessageSquareHeart,
  Wallet,
  ReceiptText,
  RotateCcw,
  ListTodo,
  Users,
  Settings,
  Search,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/live", label: "Live overview", group: "WORKSPACE", icon: Gauge },
  { href: "/order-tools", label: "Orders", group: "WORKSPACE", icon: ClipboardList },
  { href: "/exceptions", label: "Needs attention", group: "WORKSPACE", icon: TriangleAlert },
  { href: "/incidents", label: "Incidents", group: "WORKSPACE", icon: Flag },
  { href: "/providers", label: "Partner kitchens", group: "OPERATIONS", icon: Store },
  { href: "/couriers", label: "Courier shifts", group: "OPERATIONS", icon: Bike },
  { href: "/inventory", label: "Kitchen stock", group: "OPERATIONS", icon: PackageSearch },
  { href: "/quality", label: "Quality standards", group: "OPERATIONS", icon: BadgeCheck },
  { href: "/menu", label: "Menu studio", group: "GROWTH", icon: UtensilsCrossed },
  { href: "/growth", label: "Offers & campaigns", group: "GROWTH", icon: Megaphone },
  { href: "/insights", label: "Insights", group: "GROWTH", icon: ChartLine },
  { href: "/support", label: "Customer care", group: "CUSTOMER EXPERIENCE", icon: Headset },
  {
    href: "/feedback",
    label: "Private feedback",
    group: "CUSTOMER EXPERIENCE",
    icon: MessageSquareHeart,
  },
  { href: "/finance", label: "Partner finance", group: "FINANCE", icon: Wallet },
  { href: "/cash", label: "Cash reconciliation", group: "FINANCE", icon: ReceiptText },
  { href: "/refunds", label: "Refunds", group: "FINANCE", icon: RotateCcw },
  { href: "/tasks", label: "Team tasks", group: "MANAGE", icon: ListTodo },
  { href: "/team-access", label: "Team access", group: "MANAGE", icon: Users },
  { href: "/config", label: "Settings", group: "MANAGE", icon: Settings },
] as const;

export function OpsShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [permissions, setPermissions] = useState<string[] | undefined | null>(
    null,
  );
  const [navQuery, setNavQuery] = useState("");
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

  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <a className="panel-skip-link" href="#main-content">
        Skip to content
      </a>
      {/* Floating icon rail, matching the customer app's rounded surfaces. */}
      <aside
        aria-label="Operations"
        className="panel-rail"
      >
        <div className="panel-rail-logo" aria-hidden="true">
          <Image
            src="/yespizz-icon.svg"
            alt=""
            width={26}
            height={26}
            priority
          />
        </div>
        <nav
          aria-label="Operations"
          className="panel-navigation panel-rail-nav"
        >
          {availableNav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                aria-current={active ? "page" : undefined}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                className="panel-rail-item"
              >
                <Icon size={19} strokeWidth={2} aria-hidden="true" />
                <span className="panel-rail-tip" role="presentation">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="panel-rail-footer">
          <AppearanceToggle compact />
          <button
            type="button"
            className="panel-rail-item"
            aria-label="Log out"
            title="Log out"
            onClick={() => {
              clearAdminToken();
              router.replace("/login");
            }}
          >
            <LogOut size={19} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </aside>
      <div className="panel-shell flex min-w-0 flex-1 flex-col">
      <header className="panel-topbar">
        <div className="panel-topbar-brand">
          <div className="w-fit rounded-xl bg-[#02020e] px-3 py-1.5">
            <Image
              src="/yespizz-wordmark.svg"
              alt="Yespizz"
              width={110}
              height={36}
              priority
            />
          </div>
          <p className="text-muted hidden text-xs md:block">Operations</p>
        </div>
        <div className="panel-topbar-actions">
          <label className="panel-topbar-search">
            <Search size={16} aria-hidden="true" />
            <span className="sr-only">Find a workspace</span>
            <input
              type="search"
              placeholder="Search workspaces…"
              value={navQuery}
              onChange={(e) => setNavQuery(e.target.value)}
            />
          </label>
          {navQuery.trim() ? (
            <div className="panel-search-pop" role="listbox" aria-label="Matching workspaces">
              {availableNav
                .filter((item) =>
                  item.label
                    .toLowerCase()
                    .includes(navQuery.trim().toLowerCase()),
                )
                .slice(0, 8)
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      role="option"
                      aria-selected={
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)
                      }
                      href={item.href}
                      onClick={() => setNavQuery("")}
                    >
                      <Icon size={15} aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}
              {!availableNav.some((item) =>
                item.label
                  .toLowerCase()
                  .includes(navQuery.trim().toLowerCase()),
              ) ? (
                <p className="text-muted px-3 py-2 text-xs">No match.</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
      <main
        id="main-content"
        tabIndex={-1}
        className="panel-main min-w-0 flex-1 p-4 md:p-8"
      >
        <header className="panel-workspace-heading">
          <div>
            <span>YESPIZZ / OPERATIONS</span>
            <h2>
              {NAV.find(
                (item) =>
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`),
              )?.label ?? "Workspace"}
            </h2>
          </div>
        </header>
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
                ? "Use the navigation rail to open an area assigned to you."
                : "No areas are assigned yet. Ask a full administrator to update your team access."}
            </p>
          </section>
        )}
      </main>
      </div>
    </div>
  );
}

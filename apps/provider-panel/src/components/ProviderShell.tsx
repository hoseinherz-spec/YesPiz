"use client";
import { AppearanceToggle } from "@repo/theme";
import Image from "next/image";
import { providersClient } from "@repo/api";
import { Notifications } from "@repo/api/components/notifications";
import { getProviderToken } from "@/lib/auth";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { clearProviderToken } from "@/lib/auth";
import {
  ChefHat,
  Inbox,
  PackageCheck,
  Gauge,
  Boxes,
  ReceiptText,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/kitchen", label: "Kitchen board", icon: ChefHat },
  { href: "/offers", label: "Incoming offers", icon: Inbox },
  { href: "/batches", label: "Courier handoff", icon: PackageCheck },
  { href: "/operations", label: "Capacity & hours", icon: Gauge },
  { href: "/inventory", label: "Stock", icon: Boxes },
  { href: "/statement", label: "Settlements", icon: ReceiptText },
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
    <div className="provider-workspace flex min-h-dvh flex-col md:flex-row">
      <a className="panel-skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="panel-rail" aria-label="Kitchen">
        <div className="panel-rail-logo" aria-hidden="true">
          <Image
            src="/yespizz-icon.svg"
            alt=""
            width={26}
            height={26}
            priority
          />
        </div>
        <nav aria-label="Kitchen" className="panel-navigation panel-rail-nav">
          {NAV.map((item) => {
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
              clearProviderToken();
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
            <p className="text-muted hidden text-xs md:block">{kitchenName}</p>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className="panel-main min-w-0 flex-1 p-4 md:p-8"
        >
          <header className="panel-workspace-heading">
            <div>
              <span>YESPIZZ / KITCHEN PARTNER</span>
              <h2>
                {NAV.find((item) => pathname.startsWith(item.href))?.label ??
                  "Workspace"}
              </h2>
            </div>
            <Link className="panel-workspace-pill" href="/operations/">
              Manage availability →
            </Link>
          </header>
          <Notifications accessToken={getProviderToken()} />
          {children}
        </main>
      </div>
    </div>
  );
}

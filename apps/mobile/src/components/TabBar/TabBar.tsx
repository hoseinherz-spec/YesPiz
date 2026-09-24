"use client";

import { Typography } from "@heroui/react";
import Link from "next/link";
import { AnimatedBackground } from "@repo/ui/animated-background";
import { usePathname } from "next/navigation";

import { useApp } from "@/context/AppContext";

import { tabBar } from "./TabBar.styles";
import "./TabBar.css";

const TABS = [
  { href: "/home/", navKey: "nav.home", icon: "home" },
  { href: "/orders/", navKey: "nav.orders", icon: "orders" },
  { href: "/profile/", navKey: "nav.profile", icon: "profile" },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { t } = useApp();
  const styles = tabBar();

  return (
    <>
      <div className={styles.fade()} aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((layer) => (
          <div
            key={layer}
            className={`bottom-nav-blur bottom-nav-blur-${layer}`}
          />
        ))}
      </div>
      <nav className={styles.nav()}>
        <div className={styles.pill()}>
          <AnimatedBackground
            value={
              TABS.find(
                (tab) =>
                  pathname === tab.href.replace(/\/$/, "") ||
                  pathname.startsWith(tab.href),
              )?.href ?? null
            }
          >
            {TABS.map((tab) => {
              const focused =
                pathname === tab.href.replace(/\/$/, "") ||
                pathname.startsWith(tab.href);
              const tabStyles = tabBar({ focused });

              return (
                <Link
                  key={tab.href}
                  data-id={tab.href}
                  href={tab.href}
                  aria-current={focused ? "page" : undefined}
                  className={tabStyles.tab()}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    style={{
                      color: focused ? "var(--selection)" : "var(--nav-muted)",
                    }}
                  >
                    {tab.icon === "home" ? (
                      <path
                        fillRule="evenodd"
                        d="M9.5 2.6a4.3 4.3 0 0 1 5 0l5.2 3.8a4 4 0 0 1 1.6 3.2V18a3.5 3.5 0 0 1-3.5 3.5H6.2A3.5 3.5 0 0 1 2.7 18V9.6a4 4 0 0 1 1.6-3.2l5.2-3.8ZM12 13a1 1 0 0 0-1 1v3a1 1 0 1 0 2 0v-3a1 1 0 0 0-1-1Z"
                      />
                    ) : tab.icon === "orders" ? (
                      <path d="M5 2a3 3 0 0 0-3 3v16a1 1 0 0 0 1.7.7L7 18.5l3.3 3.2A1 1 0 0 0 12 21V10h7a3 3 0 0 0 3-3V5a3 3 0 0 0-3-3H5Zm12 2h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2V4Z" />
                    ) : (
                      <>
                        <circle cx="12" cy="7" r="5" />
                        <ellipse cx="12" cy="18" rx="7.5" ry="5" />
                      </>
                    )}
                  </svg>
                  <Typography type="body-xs" className={tabStyles.label()}>
                    {t(tab.navKey)}
                  </Typography>
                </Link>
              );
            })}
          </AnimatedBackground>
        </div>
      </nav>
    </>
  );
}

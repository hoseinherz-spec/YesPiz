"use client";
import { AppText } from "@/components/Text";

import { Typography } from "@heroui/react";
import { FileText, Home, User, ShoppingBag } from "@repo/icons";
import Link from "next/link";
import { AnimatedBackground } from "@repo/ui/animated-background";
import { usePathname } from "next/navigation";

import { useApp } from "@/context/AppContext";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/constants/pizzas";

import { tabBar } from "./TabBar.styles";

const TABS = [
  { href: "/home/", navKey: "nav.home", icon: Home },
  { href: "/orders/", navKey: "nav.orders", icon: FileText },
  { href: "/profile/", navKey: "nav.profile", icon: User },
] as const;

export function TabBar() {
  const pathname = usePathname();
  const { t } = useApp();
  const { count, total } = useCart();
  const styles = tabBar();

  return (
    <>
      <div className={styles.fade()} />
      <nav className={styles.nav()}>
        <div
          className={styles.pill()}
          style={{
            backgroundColor: "var(--nav-background)",
            backdropFilter: "blur(28px) saturate(1.2)",
            WebkitBackdropFilter: "blur(28px) saturate(1.2)",
          }}
        >
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
              const Icon = tab.icon;
              const tabStyles = tabBar({ focused });

              return (
                <Link
                  key={tab.href}
                  data-id={tab.href}
                  href={tab.href}
                  aria-current={focused ? "page" : undefined}
                  className={tabStyles.tab()}
                >
                  <Icon
                    size={20}
                    color={focused ? "var(--selection)" : "var(--nav-muted)"}
                  />
                  <Typography type="body-xs" className={tabStyles.label()}>
                    {t(tab.navKey)}
                  </Typography>
                </Link>
              );
            })}
          </AnimatedBackground>
        </div>
        <Link
          href="/cart/"
          className="cart-dock-action"
          aria-label={`${t("cart.title")}, ${count} ${count === 1 ? t("common.item") : t("common.items")}, ${formatPrice(total)}`}
        >
          <ShoppingBag size={23} />
          {count > 0 && (
            <AppText as="span" className="cart-dock-count" aria-hidden="true">
              {count > 99 ? "99+" : count}
            </AppText>
          )}
        </Link>
      </nav>
    </>
  );
}

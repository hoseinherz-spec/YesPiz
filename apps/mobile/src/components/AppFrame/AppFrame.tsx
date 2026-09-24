"use client";

import { ProductTelemetry } from "@/components/ProductTelemetry";
import { APP_MAX_WIDTH } from "@/constants/theme";
import { cn } from "@/lib/cn";
import { usePathname } from "next/navigation";
import supporting from "./SupportingScreens.module.css";

import { TabBar } from "@/components/TabBar";

import { appFrame } from "./AppFrame.styles";
import type { AppFrameProps } from "./AppFrame.types";

const supportingRoutes = new Set([
  "addresses",
  "call",
  "cart",
  "chat",
  "checkout",
  "credit",
  "feedback",
  "group",
  "help",
  "notifications",
  "order-success",
  "orders",
  "partner",
  "payment",
  "profile",
  "referrals",
  "rewards",
  "saved",
  "security",
  "settings",
]);

export function AppFrame({
  children,
  withTabs = false,
  className,
  padded = true,
}: AppFrameProps) {
  const styles = appFrame({ padded, withTabs });
  const pathname = usePathname();
  const isSupporting = supportingRoutes.has(pathname.split("/")[1] ?? "");

  return (
    <div className={styles.root()}>
      <div
        className={cn(styles.shell(), isSupporting && supporting.shell)}
        style={{ maxWidth: APP_MAX_WIDTH }}
      >
        <main
          className={cn(
            styles.main(),
            className,
            isSupporting && supporting.screen,
            isSupporting && withTabs && supporting.tabs,
          )}
        >
          <ProductTelemetry />
          {children}
        </main>
        {withTabs ? <TabBar /> : null}
      </div>
    </div>
  );
}

"use client";
import { BrandLogo } from "@/components/BrandLogo";
import { ScrollHeader } from "@/components/ScrollHeader";
import Link from "next/link";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { Bell1 } from "@/components/animated-icon/icons";
import { useApp } from "@/context/AppContext";
export function ReferenceHeader() {
  const { t, unreadCount } = useApp();
  return (
    <ScrollHeader className="reference-brand">
      <Link href="/home/" aria-label="Yespiz">
        <BrandLogo />
      </Link>
      <IconBadgeButton
        badge={unreadCount}
        href="/notifications/"
        aria-label={t("notifications.title")}
      >
        <Bell1 size={22} />
      </IconBadgeButton>
    </ScrollHeader>
  );
}

"use client";
import Link from "next/link";
import { Bell1 } from "@repo/icons";
import { useApp } from "@/context/AppContext";
export function ReferenceHeader() {
  const { t } = useApp();
  return (
    <header className="reference-brand">
      <Link href="/home/" aria-label="Yespiz">
        <span className="text-[26px] font-extrabold italic tracking-tight text-foreground">
          Yespiz<span className="text-accent">.</span>
        </span>
      </Link>
      <Link href="/notifications/" aria-label={t("notifications.title")}>
        <Bell1 size={22} />
      </Link>
    </header>
  );
}

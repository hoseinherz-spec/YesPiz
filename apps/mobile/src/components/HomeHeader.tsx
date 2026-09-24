"use client";

import Link from "next/link";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { Bell1, MapPin, User } from "@/components/animated-icon/icons";
import { useApp } from "@/context/AppContext";
import { SearchField } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import styles from "./HomeBanners.module.css";

export function HomeHeader({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (value: string) => void;
}) {
  const { user, addresses, selectedAddressId, language, t, unreadCount, authed } =
    useApp();
  const address = addresses.find((entry) => entry.id === selectedAddressId);
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);
  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY;
      if (Math.abs(next - lastY.current) < 6 && next > 72) return;
      setHidden(next > lastY.current && next > 72);
      lastY.current = next;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header className={styles.header} data-hidden={hidden || undefined} onFocusCapture={() => setHidden(false)}>
        <IconBadgeButton
          href="/profile/"
          className={styles.avatar}
          aria-label={t("profile.title")}
        >
          {user?.firstName ? (
            user.firstName.charAt(0).toUpperCase()
          ) : (
            <User size={25} />
          )}
        </IconBadgeButton>
        {authed ? (
          <Link href="/addresses/" className={styles.location}>
            <span>{language === "de" ? "Lieferadresse" : "Location"}</span>
            <strong>
              <MapPin size={22} />
              <span>{address?.detail || t("home.addAddress")}</span>
              <span aria-hidden="true">⌄</span>
            </strong>
          </Link>
        ) : (
          <span className={styles.headerSpacer} aria-hidden="true" />
        )}
        <IconBadgeButton
          badge={unreadCount}
          href="/notifications/"
          className={styles.roundButton}
          aria-label={t("notifications.title")}
        >
          <Bell1 size={24} />
        </IconBadgeButton>
      </header>
      <div className={styles.searchRow}>
        <SearchField className={styles.search} aria-label={t("home.search")} value={search} onChange={onSearchChange}>
          <SearchField.Group className={styles.searchInner}>
            <SearchField.SearchIcon />
            <SearchField.Input placeholder={t("home.search")} />
            <SearchField.ClearButton className="rounded-full" />
          </SearchField.Group>
        </SearchField>
        <IconBadgeButton
          href="/menu/"
          className={styles.roundButton}
          aria-label={
            language === "de"
              ? "Menü und Filter öffnen"
              : "Open menu and filters"
          }
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            aria-hidden="true"
          >
            <path d="M3 7h5m5 0h8M3 17h10m5 0h3" />
            <rect x="8" y="4" width="5" height="6" rx="2" />
            <rect x="13" y="14" width="5" height="6" rx="2" />
          </svg>
        </IconBadgeButton>
      </div>
    </>
  );
}

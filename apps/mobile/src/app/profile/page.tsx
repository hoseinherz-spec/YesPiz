"use client";
import { OffersRail } from "@/components/OffersRail";
import { BrandLogo } from "@/components/BrandLogo";
import { useState, type ReactNode } from "react";
import { Avatar, Button, Drawer } from "@heroui/react";
import {
  Heart,
  ShoppingBag,
  Wallet,
  Gift,
  User,
  Bell1,
  Shield,
  MenuGrid,
  Info,
  MapPin,
  ChevronRight,
  UserPlus,
  ArrowRight,
  X,
} from "@/components/animated-icon/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppFrame } from "@/components/AppFrame";
import { ScrollHeader } from "@/components/ScrollHeader";
import { IconBadgeButton } from "@/components/IconBadgeButton";
import { useApp } from "@/context/AppContext";
import { LANGUAGES } from "@/constants/i18n";
import { IdentitySkeleton } from "@/features/profile/components/ProfileSkeletons";
import styles from "@/features/profile/components/Profile.module.css";

export default function ProfilePage() {
  const router = useRouter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheet, setSheet] = useState<"logout" | "language" | "sounds" | null>(
    null,
  );
  const {
    t,
    language,
    setLanguage,
    authed,
    hydrated,
    userName,
    userEmail,
    unreadCount,
    logout,
  } = useApp();
  const de = language === "de";
  const row = (
    label: string,
    icon: ReactNode,
    href?: string,
    onPress?: () => void,
    detail?: string,
  ) => {
    const content = (
      <>
        <span className={styles.icon}>{icon}</span>
        <span className={styles.rowLabel}>{label}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
        <ChevronRight size={18} />
      </>
    );
    return href ? (
      <Link className={styles.row} href={href}>
        {content}
      </Link>
    ) : (
      <Button variant="ghost" className={styles.row} onPress={onPress}>
        {content}
      </Button>
    );
  };
  return (
    <AppFrame padded={false} withTabs className={styles.page}>
      <ScrollHeader className={styles.brand}>
        <Link href="/home/" aria-label="Yespiz home" className={styles.logo}>
          <BrandLogo />
        </Link>
        <IconBadgeButton
          href="/notifications/"
          badge={unreadCount}
          aria-label={t("notifications.title")}
        >
          <Bell1 size={23} />
        </IconBadgeButton>
      </ScrollHeader>
      <div className={styles.pageIntro}>
        <h1>{de ? "Dein Konto" : "Your account"}</h1>
        <p>
          {de
            ? "Alles für deine nächste Pizzapause."
            : "Everything for your next pizza night."}
        </p>
      </div>
      <OffersRail compact />
      {!hydrated ? (
        <IdentitySkeleton />
      ) : (
        <>
          <Link
            className={styles.identity}
            href={
              authed ? "/profile/edit/" : "/auth/sign-in/?next=/profile/edit/"
            }
          >
            <Avatar className={styles.avatar}>
              <Avatar.Fallback>
                {userName ? (
                  userName.slice(0, 1).toUpperCase()
                ) : (
                  <User size={34} />
                )}
              </Avatar.Fallback>
            </Avatar>
            <div>
              <h2>
                {userName ||
                  (de ? "Willkommen bei Yespiz" : "Welcome to Yespiz")}
              </h2>
              <p>{userEmail || t("profile.signInPrompt")}</p>
              <span className={styles.editLabel}>
                {authed
                  ? de
                    ? "Profil bearbeiten"
                    : "Edit profile"
                  : de
                    ? "Anmelden"
                    : "Sign in"}
              </span>
            </div>
            <ChevronRight size={18} />
          </Link>
        </>
      )}
      <div className={styles.shortcuts}>
        <Link href="/orders/">
          <ShoppingBag size={24} aria-hidden="true" />
          <strong>{de ? "Bestellungen" : "Your orders"}</strong>
          <span>{de ? "Verfolgen & ansehen" : "Track & review"}</span>
        </Link>
        <Link href="/credit/">
          <Wallet size={24} aria-hidden="true" />
          <strong>{de ? "Guthaben" : "Your credit"}</strong>
          <span>{de ? "Guthaben ansehen" : "View balance"}</span>
        </Link>
      </div>
      <nav aria-label={t("profile.accountMenu")}>
        <h2 className={styles.groupTitle}>
          {de ? "Für deine Bestellung" : "Ordering essentials"}
        </h2>
        <div className={styles.group}>
          {row(
            de ? "Meine Favoriten" : "My Favorites",
            <Heart size={23} />,
            "/saved/",
          )}
          {row(
            de ? "Angebote & Prämien" : "Special Offers & Promo",
            <Gift size={23} />,
            "/rewards/",
          )}
          {row(
            de ? "Zahlungsmethoden" : "Payment Methods",
            <Wallet size={23} />,
            "/profile/payment-methods/",
          )}
          {row(
            de ? "Adressen" : "Address",
            <MapPin size={23} />,
            "/addresses/",
          )}
        </div>
        <h2 className={styles.groupTitle}>
          {de ? "Einstellungen & Hilfe" : "Preferences & support"}
        </h2>
        <div className={styles.group}>
          {row(
            de ? "Sicherheit" : "Security",
            <Shield size={23} />,
            "/security/",
          )}
          {row(
            de ? "Töne" : "Sounds",
            <Bell1 size={23} />,
            undefined,
            () => (setSheet("sounds"), setSheetOpen(true)),
          )}
          {row(
            de ? "Sprache" : "Language",
            <MenuGrid size={23} />,
            undefined,
            () => (setSheet("language"), setSheetOpen(true)),
            de ? "Deutsch" : "English",
          )}
          {row(
            de ? "Hilfe-Center" : "Help Center",
            <Info size={23} />,
            "/help/",
          )}
          {row(
            de ? "Freunde einladen" : "Invite Friends",
            <UserPlus size={23} />,
            "/referrals/",
          )}
        </div>
        <Button
          variant="ghost"
          className={`${styles.row} ${authed ? styles.danger : ""}`}
          onPress={() =>
            authed
              ? (setSheet("logout"), setSheetOpen(true))
              : router.push("/auth/sign-in/?next=/profile/")
          }
        >
          <span className={styles.icon}>
            <ArrowRight size={23} />
          </span>
          <span className={styles.rowLabel}>
            {authed ? t("common.logout") : t("login.signIn")}
          </span>
        </Button>
      </nav>
      <div className={styles.footer}>
        <Link href="/settings/">{de ? "Einstellungen" : "Settings"}</Link>
        <Link href="/credit/">{de ? "Guthaben" : "Your credit"}</Link>
        <Link href="/settings/privacy/">{de ? "Datenschutz" : "Privacy"}</Link>
      </div>
      <Drawer
        isOpen={sheetOpen}
        onOpenChange={(open) => {
          if (!open) setSheetOpen(false);
        }}
      >
        <Drawer.Backdrop>
          <Drawer.Content
            placement="bottom"
            className="mx-auto w-full max-w-[473px]"
          >
            <Drawer.Dialog className={styles.sheet}>
              <Drawer.Header className={styles.sheetHeader}>
                <Button
                  isIconOnly
                  variant="secondary"
                  className={styles.close}
                  aria-label={de ? "Schließen" : "Close"}
                  onPress={() => setSheetOpen(false)}
                >
                  <X size={16} />
                </Button>
                <Drawer.Heading
                  className={`${styles.sheetTitle} ${sheet === "logout" ? styles.danger : ""}`}
                >
                  {sheet === "logout"
                    ? t("common.logout")
                    : sheet === "language"
                      ? de
                        ? "Sprache"
                        : "Language"
                      : de
                        ? "Töne"
                        : "Sounds"}
                </Drawer.Heading>
              </Drawer.Header>
              <Drawer.Body>
                {sheet === "logout" ? (
                  <>
                    <p className="text-center text-sm">
                      {de
                        ? "Möchtest du dich abmelden?"
                        : "Are you sure you want to log out?"}
                    </p>
                    <div className={styles.sheetActions}>
                      <Button
                        variant="outline"
                        onPress={() => setSheetOpen(false)}
                      >
                        {de ? "Abbrechen" : "Cancel"}
                      </Button>
                      <Button
                        onPress={() => {
                          logout();
                          router.replace("/auth/sign-in/");
                        }}
                      >
                        {de ? "Ja, abmelden" : "Yes, Logout"}
                      </Button>
                    </div>
                  </>
                ) : sheet === "language" ? (
                  <div className="grid gap-3">
                    {LANGUAGES.map((option) => (
                      <Button
                        key={option.id}
                        fullWidth
                        className={styles.languageOption}
                        variant={
                          language === option.id ? "primary" : "secondary"
                        }
                        aria-pressed={language === option.id}
                        onPress={() => {
                          setLanguage(option.id);
                          setSheetOpen(false);
                        }}
                      >
                        <span
                          className={styles.languageFlag}
                          aria-hidden="true"
                        >
                          {option.id === "de" ? (
                            <svg viewBox="0 0 30 30">
                              <path fill="#181818" d="M0 0h30v10H0z" />
                              <path fill="#dc3434" d="M0 10h30v10H0z" />
                              <path fill="#ffcc45" d="M0 20h30v10H0z" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 30 30">
                              <path fill="#234279" d="M0 0h30v30H0z" />
                              <path
                                stroke="#fff"
                                strokeWidth="7"
                                d="m0 0 30 30M30 0 0 30"
                              />
                              <path
                                stroke="#d52c43"
                                strokeWidth="3"
                                d="m0 0 30 30M30 0 0 30"
                              />
                              <path
                                stroke="#fff"
                                strokeWidth="10"
                                d="M15 0v30M0 15h30"
                              />
                              <path
                                stroke="#d52c43"
                                strokeWidth="6"
                                d="M15 0v30M0 15h30"
                              />
                            </svg>
                          )}
                        </span>
                        {option.label}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className={styles.note}>
                      {de
                        ? "Benachrichtigungstöne werden in den Systemeinstellungen deines Geräts verwaltet."
                        : "Notification sounds are managed in your device’s system settings."}
                    </p>
                    <Button
                      fullWidth
                      variant="secondary"
                      onPress={() => {
                        setSheetOpen(false);
                        router.push("/notifications/");
                      }}
                    >
                      {de
                        ? "Benachrichtigungen verwalten"
                        : "Manage notifications"}
                    </Button>
                  </>
                )}
              </Drawer.Body>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </AppFrame>
  );
}

"use client";
import { AppText } from "@/components/Text";


import { Button } from "@heroui/react";
import {
  Heart,
  FileText,
  Wallet,
  Gift,
  ArrowRight,
  User,
  Bell1,
  Shield,
  MenuGrid,
  MessageCircle,
} from "@repo/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { AppFrame } from "@/components/AppFrame";
import { useApp } from "@/context/AppContext";
import { hx } from "@/lib/heroui-classes";

const MENU_ITEMS = [
  { key: "profile.edit", href: "/profile/edit/", auth: true, icon: User },
  { key: "profile.saved", href: "/saved/", icon: Heart },
  { key: "profile.settings", href: "/settings/", icon: MenuGrid },
  { key: "profile.notifications", href: "/notifications/", icon: Bell1 },
  { key: "profile.history", href: "/orders/", icon: FileText },
  { key: "profile.privacy", href: "/settings/privacy/", icon: Shield },
  { key: "profile.help", href: "/help/", icon: MessageCircle },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { t, language, authed, userName, userEmail, logout } = useApp();
  const initial = (userName || "Y").slice(0, 1).toUpperCase();

  return (
    <AppFrame padded={false} withTabs className="reference-screen profile-screen">
      <header className="profile-brand">
        <Link href="/help/" className="profile-help">{t("profile.help")}</Link>
        <div className="profile-identity">
          <AppText as="span" className="profile-avatar">{initial}</AppText>
          <div className="min-w-0">
            <AppText as="h1">{userName || (language === "de" ? "Dein Profil" : "Your profile")}</AppText>
            <AppText as="p">{userEmail || t("profile.signInPrompt")}</AppText>
          </div>
        </div>
      </header>
      <section className="profile-sheet">
        <AppText as="h2">{language === "de" ? "Dein Konto" : "Your account"}</AppText>
        <nav aria-label={t("profile.accountMenu")}>
          {[
            { key: "profile.history", href: "/orders/", icon: FileText },
            { key: "profile.saved", href: "/saved/", icon: Heart },
            { key: null, href: "/credit/", icon: Wallet, label: language === "de" ? "Guthaben" : "Your credit" },
            ...MENU_ITEMS.filter((item) => !["/orders/", "/saved/"].includes(item.href) && (!("auth" in item) || authed)),
          ].map((item) => (
            <Link key={item.href} href={item.href} className="profile-menu-row">
              <item.icon size={23} />
              <AppText as="span">{item.key ? t(item.key) : "label" in item ? item.label : ""}</AppText>
              <ArrowRight size={18} />
            </Link>
          ))}
          {authed && <Link href="/referrals/" className="profile-menu-row">
            <Gift size={23} /><AppText as="span">{language === "de" ? "Freunde einladen" : "Share and earn"}</AppText><ArrowRight size={18} />
          </Link>}
        </nav>
        <div className="pt-8 pb-6">
          {authed ? (
            <Button variant="ghost" onPress={() => { logout(); router.replace("/login/"); }} className="h-12 text-danger font-semibold">
              {t("common.logout")}
            </Button>
          ) : (
            <Button variant="primary" onPress={() => router.push("/login/?next=/profile/")} className={hx.btnPrimary}>
              {t("login.signIn")}
            </Button>
          )}
        </div>
      </section>
    </AppFrame>
  );
}

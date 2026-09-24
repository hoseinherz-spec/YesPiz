"use client";
import { AppText } from "@/components/Text";

import { Button } from "@heroui/react";
import { ChevronRight, Sun, Moon } from "@/components/animated-icon/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useState } from "react";

import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { LANGUAGES } from "@/constants/i18n";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";
import { hx } from "@/lib/heroui-classes";

function SettingsRow({
  title,
  detail,
  href,
  onPress,
  control,
}: {
  title: string;
  detail: string;
  href?: string;
  onPress?: () => void;
  control?: ReactNode;
}) {
  const content = (
    <>
      <span className="min-w-0 flex-1 text-left">
        <AppText
          as="span"
          className="block text-[16px] font-semibold text-foreground"
        >
          {title}
        </AppText>
        <AppText
          as="span"
          className="mt-1 block text-[13px] leading-relaxed text-muted"
        >
          {detail}
        </AppText>
      </span>
      {control ?? <ChevronRight size={24} color="var(--foreground)" />}
    </>
  );
  const className =
    "mb-3 flex w-full min-w-0 items-center gap-4 rounded-[24px] bg-surface px-5 py-5 text-left whitespace-normal";

  if (control) {
    return <div className={className}>{content}</div>;
  }
  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      onPress={onPress}
      className={cn(className, "h-auto justify-start")}
    >
      {content}
    </Button>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { t, mode, toggleMode, language, setLanguage, authed, logout } =
    useApp();
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);

  const clearCache = async () => {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((key) => window.caches.delete(key)));
    }
    sessionStorage.clear();
    setCacheStatus(t("settings.cacheCleared"));
  };

  return (
    <AppFrame className="reference-screen settings-screen">
      <ScreenHeader title={t("settings.title")} backHref="/profile/" />

      <div className="grid">
        <section
          className="appearance-section"
          aria-labelledby="appearance-heading"
        >
          <AppText as="h1" id="appearance-heading">
            {language === "de" ? "Wähle deinen Look" : "Choose your app theme"}
          </AppText>
          <AppText as="p">{t("settings.themeDetail")}</AppText>
          <div className="appearance-options">
            {(["light", "dark"] as const).map((option) => {
              const Icon = option === "light" ? Sun : Moon;
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={mode === option}
                  onClick={() => {
                    if (mode !== option) toggleMode();
                  }}
                  className="appearance-option"
                >
                  <span
                    className={`appearance-preview appearance-preview-${option}`}
                  >
                    <Icon size={28} />
                  </span>
                  <AppText as="span">
                    {language === "de"
                      ? option === "light"
                        ? "Heller Modus"
                        : "Dunkler Modus"
                      : option === "light"
                        ? "Light mode"
                        : "Dark mode"}
                  </AppText>
                  <span className="appearance-radio" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </section>
        <SettingsRow
          title={t("notifications.title")}
          detail={t("settings.notificationsDetail")}
          href="/notifications/"
        />
        <div className="mb-3 rounded-[24px] bg-surface p-5">
          <AppText
            as="h2"
            className="text-[16px] font-semibold text-foreground"
          >
            {t("settings.language")}
          </AppText>
          <AppText
            as="p"
            className="mt-1 text-[13px] leading-relaxed text-muted"
          >
            {t("settings.languageDetail")}
          </AppText>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {LANGUAGES.map((option) => (
              <Button
                key={option.id}
                variant={language === option.id ? "primary" : "secondary"}
                onPress={() => setLanguage(option.id)}
                className="h-12 w-full rounded-full font-semibold"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <SettingsRow
          title={t("settings.addresses")}
          detail={t("settings.addressDetail")}
          href="/addresses/"
        />
        <SettingsRow
          title={t("settings.cache")}
          detail={cacheStatus ?? t("settings.cacheDetail")}
          onPress={() => void clearCache()}
        />
        <SettingsRow
          title={t("settings.help")}
          detail={t("settings.supportDetail")}
          href="/help/"
        />
        <SettingsRow
          title={t("settings.privacy")}
          detail={t("privacy.updated")}
          href="/settings/privacy/"
        />
        <SettingsRow
          title={t("settings.versionTitle")}
          detail={t("settings.versionDetail")}
          onPress={() => setCacheStatus(t("settings.versionDetail"))}
        />
      </div>

      {authed ? (
        <Button
          variant="danger"
          onPress={() => {
            logout();
            router.replace("/auth/sign-in/");
          }}
          className={cn(hx.btnDanger, "mt-10 mb-8")}
        >
          {t("common.logout")}
        </Button>
      ) : null}
    </AppFrame>
  );
}

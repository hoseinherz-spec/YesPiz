"use client";
import { AnalyticsPreference } from "@/components/AnalyticsPreference";
import { AppText } from "@/components/Text";

import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";

const SECTIONS = [
  ["privacy.introTitle", "privacy.introBody"],
  ["privacy.dataTitle", "privacy.dataBody"],
  ["privacy.controlTitle", "privacy.controlBody"],
  ["privacy.childrenTitle", "privacy.childrenBody"],
] as const;

export default function PrivacyPage() {
  const { t } = useApp();

  return (
    <AppFrame className="reference-screen">
      <ScreenHeader title={t("privacy.title")} backHref="/settings/" />
      <article className="pb-[max(40px,env(safe-area-inset-bottom))]">
        {SECTIONS.map(([title, body]) => (
          <section key={title} className="mb-9">
            <AppText
              as="h1"
              className="text-[26px] font-bold tracking-[-0.02em] text-foreground"
            >
              {t(title)}
            </AppText>
            <AppText
              as="p"
              className="mt-3 text-[15px] leading-[1.65] text-text-secondary"
            >
              {t(body)}
            </AppText>
          </section>
        ))}
        <AppText
          as="p"
          className="border-t border-border pt-6 text-sm text-muted"
        >
          {t("privacy.updated")}
        </AppText>
      </article>
      <AnalyticsPreference />
    </AppFrame>
  );
}

"use client";
import { AppText } from "@/components/Text";

import { Button, Card } from "@heroui/react";
import { Gift, Info, Truck } from "@repo/icons";

import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/cn";

function PreferenceRow({
  title,
  detail,
  selected,
  onChange,
}: {
  title: string;
  detail: string;
  selected: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 border-b border-border py-6">
      <div className="min-w-0 flex-1">
        <AppText as="h2" className="text-[16px] font-semibold text-foreground">
          {title}
        </AppText>
        <AppText as="p" className="mt-1 text-sm leading-relaxed text-muted">
          {detail}
        </AppText>
      </div>
      <ThemeSwitch
        isSelected={selected}
        onChange={onChange}
        aria-label={title}
      />
    </div>
  );
}

export default function NotificationsPage() {
  const {
    t,
    notifications,
    markAllRead,
    unreadCount,
    pushEnabled,
    setPushEnabled,
    emailNotificationsEnabled,
    setEmailNotificationsEnabled,
    smsNotificationsEnabled,
    setSmsNotificationsEnabled,
  } = useApp();

  return (
    <AppFrame className="reference-screen">
      <ScreenHeader title={t("notifications.title")} backHref="/settings/" />

      <details className="reference-faq mb-5">
        <summary>{t("notifications.preferences")}</summary>
        <section aria-labelledby="notification-preferences">
          <AppText
            as="h1"
            id="notification-preferences"
            className="text-xs font-semibold tracking-wider text-muted uppercase"
          >
            {t("notifications.preferences")}
          </AppText>
          <PreferenceRow
            title={t("notifications.sms")}
            detail={t("notifications.smsDetail")}
            selected={smsNotificationsEnabled}
            onChange={setSmsNotificationsEnabled}
          />
          <PreferenceRow
            title={t("notifications.email")}
            detail={t("notifications.emailDetail")}
            selected={emailNotificationsEnabled}
            onChange={setEmailNotificationsEnabled}
          />
          <PreferenceRow
            title={t("notifications.push")}
            detail={t("notifications.pushDetail")}
            selected={pushEnabled}
            onChange={setPushEnabled}
          />
        </section>
      </details>

      <section className="pt-3 pb-8" aria-labelledby="notification-activity">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <AppText
              as="h2"
              id="notification-activity"
              className="text-[16px] font-semibold text-foreground"
            >
              {t("notifications.activity")}
            </AppText>
            <AppText as="p" className="mt-1 text-sm text-muted">
              {unreadCount
                ? t("notifications.unread", { n: unreadCount })
                : t("notifications.caughtUp")}
            </AppText>
          </div>
          {unreadCount ? (
            <Button
              variant="ghost"
              onPress={markAllRead}
              className="h-11 rounded-full px-3 text-sm font-semibold"
            >
              {t("notifications.markAll")}
            </Button>
          ) : null}
        </div>

        <div className="grid gap-3">
          {notifications.map((notification) => {
            const Icon =
              notification.kind === "order"
                ? Truck
                : notification.kind === "promo"
                  ? Gift
                  : Info;
            return (
              <Card
                key={notification.id}
                className="rounded-none border-0 border-b border-border bg-transparent shadow-none"
              >
                <Card.Content className="flex gap-3 p-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                    <Icon size={19} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start gap-2">
                      <AppText
                        as="h3"
                        className="flex-1 font-bold text-foreground"
                      >
                        {t(notification.title)}
                      </AppText>
                      {notification.unread ? (
                        <span className="mt-2 size-2 rounded-full bg-danger" />
                      ) : null}
                    </div>
                    <AppText
                      as="p"
                      className="mt-1 text-sm leading-relaxed text-muted"
                    >
                      {t(notification.body)}
                    </AppText>
                    <AppText
                      as="p"
                      className={cn("mt-2 text-xs font-medium text-muted")}
                    >
                      {t(notification.time)}
                    </AppText>
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      </section>
    </AppFrame>
  );
}

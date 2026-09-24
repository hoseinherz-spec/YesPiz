"use client";

import { Button, Skeleton } from "@heroui/react";
import { Bell, Gift, ShoppingBag, X, Wallet, User } from "lucide-react";
import { Notifications } from "@repo/api/components/notifications";
import { AppFrame } from "@/components/AppFrame";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useApp } from "@/context/AppContext";
import styles from "./notifications.module.css";

export default function NotificationsPage() {
  const {
    t,
    accessToken,
    hydrated,
    notifications,
    unreadCount,
    markAllRead,
    notificationsLoading,
    notificationsError,
    notificationsSaving,
    refreshNotifications,
    loadMoreNotifications,
    hasMoreNotifications,
  } = useApp();
  const loading = !hydrated || (notificationsLoading && !notifications.length);
  return (
    <AppFrame className={styles.page}>
      <ScreenHeader title={t("notifications.title")} backHref="/profile/" />
      <section aria-label="Notifications" aria-busy={loading}>
        {loading
          ? Array.from({ length: 5 }, (_, index) => (
              <div className={styles.row} key={index} aria-hidden="true">
                <div className={styles.top}>
                  <Skeleton className="size-[60px] shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-2/3 rounded-lg" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <Skeleton className="h-4 w-full rounded-lg" />
                  <Skeleton className="h-4 w-5/6 rounded-lg" />
                </div>
              </div>
            ))
          : notifications.map((notification) => {
              const cancelled = /cancel|reject|fail/i.test(
                notification.title + " " + notification.body,
              );
              const payment = /card|payment/i.test(notification.title);
              const account = /account|profile/i.test(notification.title);
              const Icon = cancelled
                ? X
                : payment
                  ? Wallet
                  : account
                    ? User
                    : notification.kind === "order"
                      ? ShoppingBag
                      : notification.kind === "promo"
                        ? Gift
                        : Bell;
              const tone = cancelled
                ? "danger"
                : payment
                  ? "accent"
                  : notification.kind === "promo"
                    ? "warning"
                    : "success";
              const date = new Date(notification.time);
              return (
                <article className={styles.row} key={notification.id}>
                  <div className={styles.top}>
                    <span className={styles.icon} data-tone={tone}>
                      <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                    </span>
                    <div className={styles.heading}>
                      <h2>{notification.title}</h2>
                      <time dateTime={notification.time}>
                        {date.toLocaleDateString(undefined, {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        <span aria-hidden="true"> | </span>{" "}
                        {date.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    {notification.unread && (
                      <span className={styles.badge}>New</span>
                    )}
                  </div>
                  <p className={styles.body}>{notification.body}</p>
                </article>
              );
            })}
        {!loading && !notifications.length && !notificationsError && (
          <div className={styles.empty}>
            <Bell size={32} />
            <h2>
              {accessToken
                ? "You’re all caught up"
                : "Sign in to see notifications"}
            </h2>
            <p>
              {accessToken
                ? "Your order updates will appear here."
                : "Your notifications are linked to your account."}
            </p>
            {!accessToken && <a href="/login/">Sign in</a>}
          </div>
        )}
        {notificationsError && (
          <div role="alert" className={styles.feedback}>
            <p>{notificationsError}</p>
            <Button
              variant="secondary"
              onPress={() => void refreshNotifications()}
            >
              Retry
            </Button>
          </div>
        )}
        {hasMoreNotifications && (
          <Button
            className="mt-4 w-full"
            variant="secondary"
            isPending={notificationsLoading}
            onPress={() => void loadMoreNotifications()}
          >
            Load more
          </Button>
        )}
        {unreadCount > 0 && (
          <Button
            className="mt-4 w-full"
            variant="ghost"
            isPending={notificationsSaving}
            onPress={() => void markAllRead()}
          >
            {t("notifications.markAll")}
          </Button>
        )}
      </section>
      {accessToken && (
        <details className={styles.preferences}>
          <summary>{t("notifications.preferences")}</summary>
          <Notifications accessToken={accessToken} />
        </details>
      )}
    </AppFrame>
  );
}

"use client";
import { useEffect } from "react";

/** Push is an invalidation signal; authenticated HTTP remains the source of truth. */
export function useOrderPush(orderId: string | undefined, refresh: () => void) {
  useEffect(() => {
    if (!orderId) return;
    let disposed = false;
    const cleanup: Array<() => void> = [];
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        if (!Capacitor.isPluginAvailable("FirebaseMessaging")) return;
        const { FirebaseMessaging } =
          await import("@capacitor-firebase/messaging");
        const invalidate = ({
          notification,
        }: {
          notification: { data?: unknown };
        }) => {
          const data = notification.data as { orderId?: string } | undefined;
          if (!disposed && data?.orderId === orderId) refresh();
        };
        const received = await FirebaseMessaging.addListener(
          "notificationReceived",
          invalidate,
        );
        if (disposed) void received.remove();
        else
          cleanup.push(() => {
            void received.remove();
          });
        const opened = await FirebaseMessaging.addListener(
          "notificationActionPerformed",
          invalidate,
        );
        if (disposed) void opened.remove();
        else
          cleanup.push(() => {
            void opened.remove();
          });
      } else {
        const raw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
        if (!raw) return;
        const { getApps, initializeApp } = await import("firebase/app");
        const { getMessaging, isSupported, onMessage } =
          await import("firebase/messaging");
        if (!(await isSupported()) || disposed) return;
        const app = getApps()[0] ?? initializeApp(JSON.parse(raw));
        cleanup.push(
          onMessage(getMessaging(app), (payload) => {
            if (!disposed && payload.data?.orderId === orderId) refresh();
          }),
        );
      }
    })().catch(() => {
      /* Sockets and polling continue if push is unavailable. */
    });
    return () => {
      disposed = true;
      cleanup.forEach((remove) => remove());
    };
  }, [orderId, refresh]);
}

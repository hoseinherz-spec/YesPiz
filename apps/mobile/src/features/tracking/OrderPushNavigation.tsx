"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
/** Installed for the app lifetime so tapping a native push also works outside tracking. */
export function OrderPushNavigation() {
  const router = useRouter();
  useEffect(() => {
    let disposed = false;
    let remove: (() => Promise<void>) | undefined;
    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (
        !Capacitor.isNativePlatform() ||
        !Capacitor.isPluginAvailable("FirebaseMessaging")
      )
        return;
      const { FirebaseMessaging } =
        await import("@capacitor-firebase/messaging");
      const handle = await FirebaseMessaging.addListener(
        "notificationActionPerformed",
        ({ notification }) => {
          const orderId = (
            notification.data as { orderId?: unknown } | undefined
          )?.orderId;
          if (
            !disposed &&
            typeof orderId === "string" &&
            /^[a-f0-9]{24}$/i.test(orderId)
          )
            router.push(`/tracking/?orderId=${encodeURIComponent(orderId)}`);
        },
      );
      if (disposed) await handle.remove();
      else remove = () => handle.remove();
    })().catch(() => {
      /* Optional native integration. */
    });
    return () => {
      disposed = true;
      void remove?.();
    };
  }, [router]);
  return null;
}

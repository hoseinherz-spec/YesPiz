"use client";
import { useEffect, useState } from "react";
import { apiRequest, withAuth } from "../core";

export async function disableNotifications(accessToken: string) {
  const token = sessionStorage.getItem("yespizz_push_token");
  if (token)
    await apiRequest(
      "/api/v1/push/devices",
      withAuth({ accessToken, method: "DELETE", body: { token } }),
    );
  sessionStorage.removeItem("yespizz_push_token");
}

export function Notifications({ accessToken }: { accessToken: string | null }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!accessToken) return;
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
      const listener = await FirebaseMessaging.addListener(
        "tokenReceived",
        ({ token }) => {
          // Only renew a device that this signed-in user explicitly enabled.
          if (disposed || !sessionStorage.getItem("yespizz_push_token")) return;
          void apiRequest(
            "/api/v1/push/devices",
            withAuth({
              accessToken,
              method: "POST",
              body: { token, platform: Capacitor.getPlatform() },
            }),
          )
            .then(() => {
              if (!disposed)
                sessionStorage.setItem("yespizz_push_token", token);
            })
            .catch(() => {
              if (!disposed)
                setStatus(
                  "Enable notifications again to reconnect this device.",
                );
            });
        },
      );
      if (disposed) await listener.remove();
      else remove = () => listener.remove();
    })().catch(() => {
      if (!disposed)
        setStatus("Notification connection is unavailable. Please retry.");
    });
    return () => {
      disposed = true;
      void remove?.();
    };
  }, [accessToken]);
  useEffect(() => {
    // Re-associate a previously enabled device when the signed-in account changes.
    const token = sessionStorage.getItem("yespizz_push_token");
    if (accessToken && token)
      void apiRequest(
        "/api/v1/push/devices",
        withAuth({
          accessToken,
          method: "POST",
          body: {
            token,
            platform: sessionStorage.getItem("yespizz_push_platform") || "web",
          },
        }),
      ).catch(() =>
        setStatus("Enable notifications again to reconnect this device."),
      );
  }, [accessToken]);
  async function enable() {
    if (!accessToken) return;
    setBusy(true);
    setStatus("");
    try {
      const { Capacitor } = await import("@capacitor/core");
      const { FirebaseMessaging } =
        await import("@capacitor-firebase/messaging");
      if (
        Capacitor.isNativePlatform() &&
        !Capacitor.isPluginAvailable("FirebaseMessaging")
      )
        throw new Error(
          "Notifications are not configured in this app build yet.",
        );
      let serviceWorkerRegistration: ServiceWorkerRegistration | undefined;
      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
      if (!Capacitor.isNativePlatform()) {
        const raw = process.env.NEXT_PUBLIC_FIREBASE_CONFIG;
        if (!raw || !vapidKey)
          throw new Error("Notifications are not configured for this app yet.");
        const { initializeApp, getApps } = await import("firebase/app");
        if (!getApps().length) initializeApp(JSON.parse(raw));
        serviceWorkerRegistration = await navigator.serviceWorker.register(
          `/firebase-messaging-sw.js?config=${encodeURIComponent(raw)}`,
        );
        await navigator.serviceWorker.ready;
      }
      const permission = await FirebaseMessaging.requestPermissions();
      if (permission.receive !== "granted")
        throw new Error(
          "Allow notifications in your device settings to receive order updates.",
        );
      const result = await FirebaseMessaging.getToken({
        vapidKey,
        serviceWorkerRegistration,
      });
      const platform = Capacitor.getPlatform();
      await apiRequest(
        "/api/v1/push/devices",
        withAuth({
          accessToken,
          method: "POST",
          body: { token: result.token, platform },
        }),
      );
      sessionStorage.setItem("yespizz_push_token", result.token);
      sessionStorage.setItem("yespizz_push_platform", platform);
      setStatus("Notifications enabled.");
    } catch (err) {
      setStatus(
        err instanceof Error ? err.message : "Unable to enable notifications.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!accessToken) return null;
  return (
    <div className="my-3 flex flex-wrap gap-2 text-sm">
      <button
        type="button"
        disabled={busy}
        className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
        onClick={() => void enable()}
      >
        Enable order notifications
      </button>
      <button
        type="button"
        disabled={busy}
        className="min-h-11 rounded-full border border-border bg-card px-4 py-2 disabled:opacity-50"
        onClick={() => {
          setBusy(true);
          void disableNotifications(accessToken)
            .then(() => setStatus("Notifications disabled."))
            .catch(() =>
              setStatus("Unable to disable notifications. Please retry."),
            )
            .finally(() => setBusy(false));
        }}
      >
        Disable notifications
      </button>
      {status && <p role="status">{status}</p>}
    </div>
  );
}

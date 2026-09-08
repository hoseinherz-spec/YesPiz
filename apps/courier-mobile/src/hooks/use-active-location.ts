"use client";
import { Capacitor, CapacitorHttp, registerPlugin } from "@capacitor/core";
import type { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { couriersClient } from "@repo/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrentPosition } from "@/lib/geolocation";
import { requireCourierToken } from "@/lib/auth";

const background = registerPlugin<BackgroundGeolocationPlugin>(
  "BackgroundGeolocation",
);
export function useActiveLocationSharing(enabled: boolean) {
  const [lastPosted, setLastPosted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const posting = useRef(false);
  const post = useCallback(
    async (coords: { latitude: number; longitude: number }) => {
      if (posting.current) return;
      posting.current = true;
      try {
        const token = requireCourierToken();
        if (Capacitor.isNativePlatform()) {
          // Native HTTP continues while the WebView is backgrounded on Android.
          const result = await CapacitorHttp.post({
            url: `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8058"}/api/v1/couriers/me/location`,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            data: coords,
            connectTimeout: 10000,
            readTimeout: 10000,
          });
          if (result.status >= 400)
            throw new Error(
              "Location update failed. Reopen your shift to check your connection.",
            );
        } else
          await couriersClient.updateLocation(coords, { accessToken: token });
        setLastPosted(new Date().toISOString());
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Location update failed.",
        );
      } finally {
        posting.current = false;
      }
    },
    [],
  );
  const postOnce = useCallback(async () => {
    try {
      await post(await getCurrentPosition());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Location permission required.",
      );
    }
  }, [post]);
  useEffect(() => {
    if (!enabled) return;
    if (Capacitor.isNativePlatform()) {
      let cancelled = false;
      let watcher: string | undefined;
      void background
        .addWatcher(
          {
            backgroundTitle: "Yespizz delivery shift",
            backgroundMessage:
              "Sharing your location while on duty. End your shift to stop.",
            requestPermissions: true,
            stale: false,
            distanceFilter: 20,
          },
          (location, failure) => {
            if (cancelled) return;
            if (failure) {
              setError(failure.message);
              return;
            }
            if (
              location &&
              (!location.time || Date.now() - location.time < 60_000)
            )
              void post({
                latitude: location.latitude,
                longitude: location.longitude,
              });
          },
        )
        .then((id) => {
          if (cancelled) void background.removeWatcher({ id });
          else watcher = id;
        })
        .catch((err) =>
          setError(
            err instanceof Error
              ? err.message
              : "Background location unavailable.",
          ),
        );
      return () => {
        cancelled = true;
        if (watcher) void background.removeWatcher({ id: watcher });
      };
    }
    const immediate = setTimeout(() => void postOnce(), 0);
    const interval = setInterval(() => void postOnce(), 15000);
    return () => {
      clearTimeout(immediate);
      clearInterval(interval);
    };
  }, [enabled, post, postOnce]);
  return { lastPosted, error, postOnce };
}

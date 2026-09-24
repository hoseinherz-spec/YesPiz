"use client";
import { useCallback, useEffect, useState } from "react";
import { ordersClient, realtimeUrl, type OrderTrackingView } from "@repo/api";
import { useOrderPush } from "./useOrderPush";
import { io } from "socket.io-client";

export function useOrderTracking(
  orderId: string | undefined,
  accessToken: string | null,
) {
  const [snapshot, setSnapshot] = useState<{
    key: string;
    data: OrderTrackingView;
  } | null>(null);
  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  const [now, setNow] = useState(Date.now);
  const key = `${accessToken ?? ""}:${orderId ?? ""}`;
  const refresh = useCallback(() => setRetry((value) => value + 1), []);
  useOrderPush(accessToken ? orderId : undefined, refresh);
  useEffect(() => {
    if (!orderId || !accessToken || orderId.startsWith("o-")) return;
    let stopped = false,
      busy = false,
      queued = false,
      terminal = false;
    const controller = new AbortController();
    const load = async () => {
      if (stopped || terminal || document.hidden) return;
      if (busy) {
        queued = true;
        return;
      }
      busy = true;
      try {
        const data = await ordersClient.tracking(orderId, {
          accessToken,
          signal: controller.signal,
        });
        if (stopped) return;
        setSnapshot({ key, data });
        setFailure(null);
        terminal =
          data.order.orderState === "completed" ||
          data.order.orderState === "cancelled";
      } catch (error) {
        if (!stopped)
          setFailure({
            key,
            message:
              error instanceof Error
                ? error.message
                : "Unable to update tracking.",
          });
      } finally {
        busy = false;
        if (queued && !stopped) {
          queued = false;
          void load();
        }
      }
    };
    const socket = io(realtimeUrl(process.env.NEXT_PUBLIC_API_URL), {
      auth: { token: accessToken },
      reconnection: true,
    });
    const invalidate = (event: { orderId?: string }) => {
      if (event.orderId === orderId) void load();
    };
    socket.on("courier.location", invalidate);
    socket.on("order.status", invalidate);
    socket.on("connect", () => void load());
    const visibility = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("online", visibility);
    void load();
    const poll = setInterval(() => void load(), 5000);
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      stopped = true;
      controller.abort();
      socket.disconnect();
      clearInterval(poll);
      clearInterval(clock);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("online", visibility);
    };
  }, [key, orderId, accessToken, retry]);
  const data = snapshot?.key === key ? snapshot.data : null;
  const error = failure?.key === key ? failure.message : null;
  const age = data?.location.updatedAt
    ? now - Date.parse(data.location.updatedAt)
    : Infinity;
  const live = Boolean(
    data?.order.orderState === "active" &&
    !error &&
    age >= -5000 &&
    age <= 90000 &&
    data.location.latitude != null &&
    data.location.longitude != null,
  );
  return {
    data,
    error,
    live,
    refresh,
    now,
    loading: Boolean(
      orderId && !orderId.startsWith("o-") && accessToken && !data && !error,
    ),
  };
}

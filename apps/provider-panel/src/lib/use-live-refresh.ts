"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { realtimeUrl } from "@repo/api";

/** Socket invalidations plus the screen's polling fallback; reconnect always refetches. */
export function useLiveRefresh(
  token: string | null,
  room: string | undefined,
  refresh: () => Promise<void>,
) {
  useEffect(() => {
    if (!token || !room) return;
    let busy = false,
      queued = false,
      stopped = false;
    const update = async () => {
      if (stopped || document.hidden) return;
      if (busy) {
        queued = true;
        return;
      }
      busy = true;
      try {
        await refresh();
      } catch {
        /* Screen owns errors; polling retries. */
      } finally {
        busy = false;
        if (queued && !stopped) {
          queued = false;
          void update();
        }
      }
    };
    const socket = io(realtimeUrl(process.env.NEXT_PUBLIC_API_URL), {
      auth: { token },
      reconnection: true,
    });
    socket.on("connect", () => {
      socket.emit("join", { rooms: [room] });
      void update();
    });
    socket.on("order.status", update);
    socket.on("offer.created", update);
    socket.on("offer.expired", update);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("online", update);
    return () => {
      stopped = true;
      socket.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
    };
  }, [token, room, refresh]);
}

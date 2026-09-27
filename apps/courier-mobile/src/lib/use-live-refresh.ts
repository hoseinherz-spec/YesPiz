"use client";
import { useEffect } from "react";
import { io } from "socket.io-client";
import { couriersClient, realtimeUrl } from "@repo/api";

/** Socket invalidations plus the screen's polling fallback; reconnect always refetches. */
export function useLiveRefresh(
  token: string | null,
  room: string | undefined,
  refresh: () => Promise<void>,
) {
  useEffect(() => {
    if (!token) return;
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
      if (room) socket.emit("join", { rooms: [room] });
      else
        void couriersClient
          .getMe({ accessToken: token })
          .then((profile) => {
            if (!stopped)
              socket.emit("join", { rooms: [`courier:${profile.userId}`] });
          })
          .catch(() => undefined);
      void update();
    });
    socket.on("order.status", update);
    socket.on("offer.created", update);
    socket.on("offer.expired", update);
    const timer = window.setInterval(() => void update(), 10000);
    document.addEventListener("visibilitychange", update);
    window.addEventListener("online", update);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      socket.disconnect();
      document.removeEventListener("visibilitychange", update);
      window.removeEventListener("online", update);
    };
  }, [token, room, refresh]);
}

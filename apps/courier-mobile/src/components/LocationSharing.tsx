"use client";
import { couriersClient } from "@repo/api";
import { useEffect, useState } from "react";
import { getCourierToken } from "@/lib/auth";
import { useActiveLocationSharing } from "@/hooks/use-active-location";
export function LocationSharing() {
  const [onDuty, setOnDuty] = useState(false);
  useEffect(() => {
    let stopped = false;
    async function check() {
      const token = getCourierToken();
      if (!token) {
        if (!stopped) setOnDuty(false);
        return;
      }
      try {
        const session = await couriersClient.currentSession({
          accessToken: token,
        });
        if (!stopped) setOnDuty(!!session);
      } catch {
        /* Keep sharing through transient disconnects; the server enforces active shifts. */
      }
    }
    void check();
    const timer = setInterval(() => void check(), 5000);
    const change = () => void check();
    window.addEventListener("yespizz:shift", change);
    return () => {
      stopped = true;
      clearInterval(timer);
      window.removeEventListener("yespizz:shift", change);
    };
  }, []);
  const { error } = useActiveLocationSharing(onDuty);
  return onDuty && error ? (
    <p role="alert" className="border-b p-3 text-sm">
      Location: {error}
    </p>
  ) : null;
}

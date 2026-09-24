"use client";

import { useEffect, useState } from "react";

export function safeAuthDestination(search: string): string {
  const next = new URLSearchParams(search).get("next");
  return next?.startsWith("/") &&
    !next.startsWith("//") &&
    !/^\/(?:auth|login|signup|forgot-password|reset-password|onboarding)(?:[/?#]|$)/.test(
      next,
    ) &&
    !next.includes("\\") &&
    !/[\u0000-\u0020\u007f]/.test(next)
    ? next
    : "/home/";
}

export function authCompletionDestination(destination: string): string {
  const safe = safeAuthDestination(`?next=${encodeURIComponent(destination)}`);
  return `/auth/complete/?next=${encodeURIComponent(safe)}`;
}

export function useAuthDestination() {
  const [destination, setDestination] = useState("/home/");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDestination(safeAuthDestination(window.location.search));
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return destination;
}

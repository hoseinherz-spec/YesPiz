"use client";
import { disableNotifications } from "@repo/api/components/notifications";

const TOKEN_KEY = "yespizz_courier_token";

export function getCourierToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setCourierToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
  window.dispatchEvent(new Event("yespizz:shift"));
}

export function clearCourierToken() {
  const token = getCourierToken();
  if (token) void disableNotifications(token).catch(() => undefined);
  localStorage.removeItem(TOKEN_KEY);
  window.dispatchEvent(new Event("yespizz:shift"));
}

export function requireCourierToken(): string {
  const token = getCourierToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

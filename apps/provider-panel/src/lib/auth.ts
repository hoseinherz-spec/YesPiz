"use client";
import { disableNotifications } from "@repo/api/components/notifications";

const TOKEN_KEY = "yespizz_provider_token";

export function getProviderToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setProviderToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearProviderToken() {
  const token = getProviderToken();
  if (token) void disableNotifications(token).catch(() => undefined);
  localStorage.removeItem(TOKEN_KEY);
}

export function requireProviderToken(): string {
  const token = getProviderToken();
  if (!token) throw new Error("Not authenticated");
  return token;
}

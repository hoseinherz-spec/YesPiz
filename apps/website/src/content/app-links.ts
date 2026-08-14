/**
 * Shared product URLs — landing ↔ Customer App (web / stores).
 * Override with env in production.
 */
export const APP_WEB_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8051";

export const APP_STORE_URL =
  process.env.NEXT_PUBLIC_APP_STORE_URL ?? "#download";

export const PLAY_STORE_URL =
  process.env.NEXT_PUBLIC_PLAY_STORE_URL ?? "#download";

"use client";
import { useSyncExternalStore } from "react";
const key = "yespizz:waiting-games";
const event = "yespizz:preferences";
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(event, callback);
  };
}
function snapshot() {
  try {
    return localStorage.getItem(key) !== "off";
  } catch {
    return true;
  }
}
export function useWaitingPreference() {
  const enabled = useSyncExternalStore(subscribe, snapshot, () => true);
  return {
    enabled,
    setEnabled(value: boolean) {
      localStorage.setItem(key, value ? "on" : "off");
      window.dispatchEvent(new Event(event));
    },
  };
}

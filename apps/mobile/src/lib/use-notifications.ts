"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsClient, type NotificationInbox } from "@repo/api";
const empty: NotificationInbox = {
  items: [],
  unreadCount: 0,
  nextCursor: null,
};
export function useNotifications(accessToken: string | null) {
  const [state, setState] = useState({ token: accessToken, inbox: empty });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const token = useRef(accessToken);
  const request = useRef(0);
  const inbox = state.token === accessToken ? state.inbox : empty;
  const refresh = useCallback(
    async (before?: string) => {
      if (!accessToken) return;
      const version = ++request.current;
      setLoading(true);
      try {
        const result = await notificationsClient.list(before, { accessToken });
        if (token.current !== accessToken || version !== request.current)
          return;
        setState((prev) => ({
          token: accessToken,
          inbox: {
            ...result,
            items:
              before && prev.token === accessToken
                ? [
                    ...prev.inbox.items,
                    ...result.items.filter(
                      (item) =>
                        !prev.inbox.items.some((old) => old.id === item.id),
                    ),
                  ]
                : result.items,
          },
        }));
        setError("");
      } catch {
        if (token.current === accessToken && version === request.current)
          setError("Unable to load notifications. Please try again.");
      } finally {
        if (token.current === accessToken && version === request.current)
          setLoading(false);
      }
    },
    [accessToken],
  );
  useEffect(() => {
    token.current = accessToken;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setState({ token: accessToken, inbox: empty });
      setError("");
      setLoading(false);
      setSaving(false);
      if (accessToken) void refresh();
    });
    const update = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const interval = window.setInterval(update, 30000);
    window.addEventListener("focus", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      cancelled = true;
      token.current = null;
      clearInterval(interval);
      window.removeEventListener("focus", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [accessToken, refresh]);
  const markAllRead = async () => {
    const through = inbox.items[0]?.id;
    if (!accessToken || !through || saving) return;
    setSaving(true);
    try {
      await notificationsClient.markRead(through, { accessToken });
      if (token.current === accessToken) await refresh();
    } catch {
      if (token.current === accessToken)
        setError("Unable to mark notifications as read. Please try again.");
    } finally {
      if (token.current === accessToken) setSaving(false);
    }
  };
  return {
    notifications: inbox.items,
    unreadCount: inbox.unreadCount,
    notificationsLoading: loading,
    notificationsError: error,
    notificationsSaving: saving,
    refreshNotifications: () => refresh(),
    loadMoreNotifications: () => refresh(inbox.nextCursor ?? undefined),
    hasMoreNotifications: Boolean(inbox.nextCursor),
    markAllRead,
  };
}

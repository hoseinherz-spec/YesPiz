import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type InboxNotification = {
  id: string;
  title: string;
  body: string;
  time: string;
  unread: boolean;
  kind: "order" | "promo" | "system";
  data: Record<string, string>;
};
export type NotificationInbox = {
  items: InboxNotification[];
  unreadCount: number;
  nextCursor: string | null;
};
export const notificationsClient = {
  list: (before?: string, options?: AuthRequestOptions) =>
    apiRequest<NotificationInbox>(
      `/api/v1/push/inbox${before ? `?before=${encodeURIComponent(before)}` : ""}`,
      withAuth({ ...options, method: "GET" }),
    ),
  markRead: (through: string, options?: AuthRequestOptions) =>
    apiRequest<{ ok: boolean }>(
      "/api/v1/push/inbox/read",
      withAuth({ ...options, method: "POST", body: { through } }),
    ),
};

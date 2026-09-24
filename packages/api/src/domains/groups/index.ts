import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
import type { OrderLineRequest } from "../orders/orders.dto";
export type GroupCartView = {
  token: string;
  title: string;
  menuVersion: number;
  split: boolean;
  state: "open" | "locked" | "ordered" | "cancelling" | "cancelled";
  revision: number;
  mock: boolean;
  checkoutUrl?: string;
  refundPending: boolean;
  deadline: string;
  expired: boolean;
  owner: boolean;
  orderId?: string;
  quote: {
    totalCents: number;
    subtotalCents: number;
    deliveryFeeCents: number;
  } | null;
  members: {
    name: string;
    mine: boolean;
    quantity: number;
    paid: boolean;
    shareCents: number;
    picks: {
      menuItemId: string;
      secondHalfItemId?: string;
      quantity: number;
      size: string;
    }[];
  }[];
};
const post = <T>(path: string, body: unknown, options?: AuthRequestOptions) =>
  apiRequest<T>(
    `/api/v1/groups${path}`,
    withAuth({ ...options, method: "POST", body }),
  );
export const groupsClient = {
  refundQueue: (o?: AuthRequestOptions) =>
    apiRequest<
      { token: string; title: string; state: string; refundError?: string }[]
    >("/api/v1/groups/admin/refunds", withAuth({ ...o, method: "GET" })),
  retryRefund: (token: string, o?: AuthRequestOptions) =>
    post<{ state: string; refundError?: string }>(
      `/admin/refunds/${encodeURIComponent(token)}`,
      {},
      o,
    ),
  list: (o?: AuthRequestOptions) =>
    apiRequest<GroupCartView[]>(
      "/api/v1/groups",
      withAuth({ ...o, method: "GET" }),
    ),
  read: (token: string, o?: AuthRequestOptions) =>
    apiRequest<GroupCartView>(
      `/api/v1/groups/${encodeURIComponent(token)}`,
      withAuth({ ...o, method: "GET" }),
    ),
  create: (
    body: {
      title: string;
      menuVersion: number;
      split: boolean;
      deadline: string;
    },
    o?: AuthRequestOptions,
  ) => post<GroupCartView>("", body, o),
  contribute: (
    token: string,
    body: { revision: number; lines: OrderLineRequest[] },
    o?: AuthRequestOptions,
  ) => post<GroupCartView>(`/${encodeURIComponent(token)}/items`, body, o),
  lock: (
    token: string,
    body: { revision: number; addressId: string },
    o?: AuthRequestOptions,
  ) => post<GroupCartView>(`/${encodeURIComponent(token)}/lock`, body, o),
  payShare: (token: string, o?: AuthRequestOptions) =>
    post<GroupCartView>(`/${encodeURIComponent(token)}/share`, {}, o),
  submit: (
    token: string,
    body: { revision: number; expectedTotalCents: number },
    o?: AuthRequestOptions,
  ) => post<GroupCartView>(`/${encodeURIComponent(token)}/submit`, body, o),
  reopen: (token: string, revision: number, o?: AuthRequestOptions) =>
    post<GroupCartView>(
      `/${encodeURIComponent(token)}/reopen`,
      { revision },
      o,
    ),
  cancel: (token: string, revision: number, o?: AuthRequestOptions) =>
    post<GroupCartView>(
      `/${encodeURIComponent(token)}/cancel`,
      { revision },
      o,
    ),
};

import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type SettlementEntry = {
  id: string;
  orderId: string;
  amountCents: number;
  dueAt: string;
  status:
    "pending" | "paid" | "transferring" | "transferred" | "transfer_review";
  paidAt?: string;
  paymentReference?: string;
};
export type PartnerStatement = {
  withdrawableCents?: number;
  reservedCents?: number;
  entries: SettlementEntry[];
  pendingCents: number;
  paidCents: number;
  transferredCents: number;
};
export type FinanceOverview = {
  autoTransfersConfigured: boolean;
  entries: (Omit<SettlementEntry, "id"> & {
    _id: string;
    party: string;
    payeeId: string;
    note: string;
    autoTransfer?: boolean;
    transferError?: string;
  })[];
  completed: {
    _id: string;
    totalCents: number;
    compensationCents?: number;
    providerId?: string;
    courierId?: string;
    completedAt: string;
    deliveryZipcode?: string;
  }[];
  cash: { _id: string; collectedCents: number; receipts: number }[];
  periodDays: number;
};
export const financeClient = {
  bindAccount: (
    body: { party: string; payeeId: string; accountId: string },
    options?: AuthRequestOptions,
  ) =>
    apiRequest(
      "/api/v1/finance/admin/payout-accounts",
      withAuth({ ...options, method: "POST", body }),
    ),
  reconcile: (id: string, options?: AuthRequestOptions) =>
    apiRequest(
      `/api/v1/finance/admin/settlements/${encodeURIComponent(id)}/reconcile`,
      withAuth({ ...options, method: "POST" }),
    ),
  statement: (party: "provider" | "courier", options?: AuthRequestOptions) =>
    apiRequest<PartnerStatement>(
      `/api/v1/finance/${party}`,
      withAuth({ ...options, method: "GET" }),
    ),
  overview: (options?: AuthRequestOptions) =>
    apiRequest<FinanceOverview>(
      "/api/v1/finance/admin",
      withAuth({ ...options, method: "GET" }),
    ),
  record: (
    body: {
      orderId: string;
      party: string;
      amountCents: number;
      dueAt: string;
      note: string;
      autoTransfer?: boolean;
    },
    options?: AuthRequestOptions,
  ) =>
    apiRequest(
      "/api/v1/finance/admin/settlements",
      withAuth({ ...options, method: "POST", body }),
    ),
  paid: (id: string, paymentReference: string, options?: AuthRequestOptions) =>
    apiRequest(
      `/api/v1/finance/admin/settlements/${encodeURIComponent(id)}/paid`,
      withAuth({ ...options, method: "POST", body: { paymentReference } }),
    ),
};

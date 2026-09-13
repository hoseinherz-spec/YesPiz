import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type CreditStatement = {
  balanceCents: number;
  entries: { orderId: string; amountCents: number; at: string; kind: string }[];
};
export const walletClient = {
  statement: (options?: AuthRequestOptions) =>
    apiRequest<CreditStatement>(
      "/api/v1/wallet",
      withAuth({ ...options, method: "GET" }),
    ),
};

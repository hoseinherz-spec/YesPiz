import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
import type {
  CashAvailabilityResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from "./payments.dto";
import { paymentsEndpoints } from "./payments.endpoint";

export const paymentsClient = {
  cancel(orderId: string, reason: string, options?: AuthRequestOptions) {
    return apiRequest<import("../orders/orders.dto").CustomerOrderView>(
      "/api/v1/payments/cancel-order",
      withAuth({ ...options, method: "POST", body: { orderId, reason } }),
    );
  },
  refunds(options?: AuthRequestOptions) {
    return apiRequest<
      Array<{
        _id: string;
        orderId: string;
        amountCents: number;
        refundStatus: string;
        refundError?: string;
      }>
    >("/api/v1/payments/refunds", withAuth({ ...options, method: "GET" }));
  },
  reconcileRefund(orderId: string, options?: AuthRequestOptions) {
    return apiRequest(
      "/api/v1/payments/refunds/reconcile",
      withAuth({ ...options, method: "POST", body: { orderId } }),
    );
  },
  confirm(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<{ ok: boolean; orderId: string }>(
      "/api/v1/payments/confirm",
      withAuth({ ...options, method: "POST", body: { orderId } }),
    );
  },
  cashAvailability(options?: AuthRequestOptions) {
    return apiRequest<CashAvailabilityResponse>(
      paymentsEndpoints.cashAvailability,
      withAuth({ ...options, method: "GET" }),
    );
  },

  initiate(body: InitiatePaymentRequest, options?: AuthRequestOptions) {
    return apiRequest<InitiatePaymentResponse>(
      paymentsEndpoints.initiate,
      withAuth({ ...options, method: "POST", body }),
    );
  },
};

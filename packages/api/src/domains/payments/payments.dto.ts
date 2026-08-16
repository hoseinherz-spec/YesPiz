import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../orders/orders.dto';

export type InitiatePaymentRequest = {
  orderId: string;
  method?: PaymentMethod;
};

export type CashAvailabilityResponse = {
  available: boolean;
  failedCashCount: number;
  threshold: number;
  hardCapCents: number;
  cashTrustScore?: number;
  cashTrustTier?: string;
  reasonCode?: string;
};

export type Payment = {
  id: string;
  orderId: string;
  customerId: string;
  method: PaymentMethod;
  status: PaymentStatus;
  amountCents: number;
  providerRef?: string;
  mock: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type DispatchBroadcastResult = {
  orderId: string;
  status: OrderStatus;
  offerCount: number;
  offers: Array<{
    providerId: string;
    score: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
  }>;
};

export type InitiatePaymentResponse = {
  payment: Payment;
  orderStatus: OrderStatus;
  dispatch: DispatchBroadcastResult | null;
  mock?: boolean;
  /** Present when Stripe PaymentIntent was created (capture via webhook). */
  clientSecret?: string | null;
  paymentIntentId?: string;
};

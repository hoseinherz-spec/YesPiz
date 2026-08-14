import type { OrderLine, OrderStatus } from '../orders/orders.dto';

export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type DispatchBroadcastResponse = {
  orderId: string;
  status: OrderStatus;
  offerCount: number;
  offers: Array<{
    providerId: string;
    score: number;
    status: OfferStatus;
  }>;
};

export type ProviderOffer = {
  orderId: string;
  totalCents: number;
  lines: OrderLine[];
  score?: number;
  deliveryLatitude?: number;
  deliveryLongitude?: number;
};

export type AcceptOfferResponse = {
  orderId: string;
  status: OrderStatus;
  providerId: string;
};

export type RejectOfferResponse =
  | DispatchBroadcastResponse
  | {
      orderId: string;
      status: OrderStatus;
      reason: 'all_rejected';
    }
  | {
      orderId: string;
      status: OrderStatus;
      remainingOffers: number;
    };

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
  /** Wave bid window end (ISO) */
  expiresAt?: string;
  /** Kitchen already responded in this wave */
  respondedAt?: string;
  ready?: boolean;
  quotedPrepMinutes?: number;
  wave?: boolean;
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

export type WaveRespondRequest = {
  ready: boolean;
  quotedPrepMinutes?: number;
};

export type WaveRespondResponse = {
  orderId: string;
  status?: OrderStatus;
  ready?: boolean;
  awaitingResponses?: number;
  /** Set when this provider won the wave */
  providerId?: string;
  quotedPrepMinutes?: number;
  waveScore?: number;
  skipped?: boolean;
  waiting?: boolean;
  bidWindowEndsAt?: string;
  winnerProviderId?: string;
};

import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  AcceptOfferResponse,
  DispatchBroadcastResponse,
  ProviderOffer,
  RejectOfferResponse,
  WaveRespondRequest,
  WaveRespondResponse,
} from './dispatch.dto';
import { dispatchEndpoints } from './dispatch.endpoint';

export const dispatchClient = {
  markViewed(orderId: string, options?: AuthRequestOptions) {
    return apiRequest(`/api/v1/dispatch/orders/${encodeURIComponent(orderId)}/viewed`, withAuth({ ...options, method: 'POST' }));
  },
  broadcast(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<DispatchBroadcastResponse>(
      dispatchEndpoints.broadcast(orderId),
      withAuth({ ...options, method: 'POST' }),
    );
  },

  resolveWave(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<WaveRespondResponse>(
      dispatchEndpoints.resolveWave(orderId),
      withAuth({ ...options, method: 'POST' }),
    );
  },

  listOffers(options?: AuthRequestOptions) {
    return apiRequest<ProviderOffer[]>(
      dispatchEndpoints.offers,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  respond(
    orderId: string,
    body: WaveRespondRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<WaveRespondResponse>(
      dispatchEndpoints.respond(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  /** @deprecated Prefer respond() */
  accept(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<AcceptOfferResponse>(
      dispatchEndpoints.accept(orderId),
      withAuth({ ...options, method: 'POST' }),
    );
  },

  reject(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<RejectOfferResponse>(
      dispatchEndpoints.reject(orderId),
      withAuth({ ...options, method: 'POST' }),
    );
  },
};

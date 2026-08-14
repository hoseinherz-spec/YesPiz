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
} from './dispatch.dto';
import { dispatchEndpoints } from './dispatch.endpoint';

export const dispatchClient = {
  broadcast(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<DispatchBroadcastResponse>(
      dispatchEndpoints.broadcast(orderId),
      withAuth({ ...options, method: 'POST' }),
    );
  },

  listOffers(options?: AuthRequestOptions) {
    return apiRequest<ProviderOffer[]>(
      dispatchEndpoints.offers,
      withAuth({ ...options, method: 'GET' }),
    );
  },

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

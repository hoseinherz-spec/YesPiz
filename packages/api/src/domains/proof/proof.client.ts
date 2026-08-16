import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CashReceiptRequest,
  DeliverProofRequest,
  DeliveryProof,
  EnRouteRequest,
  PickupCodesResponse,
  PickupProofRequest,
  ProofTransitionResponse,
} from './proof.dto';
import { proofEndpoints } from './proof.endpoint';

export const proofClient = {
  get(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<DeliveryProof>(
      proofEndpoints.byOrder(orderId),
      withAuth({ ...options, method: 'GET' }),
    );
  },

  getPickupCodes(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<PickupCodesResponse>(
      proofEndpoints.codes(orderId),
      withAuth({ ...options, method: 'GET' }),
    );
  },

  pickup(
    orderId: string,
    body: PickupProofRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProofTransitionResponse>(
      proofEndpoints.pickup(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  markEnRoute(
    orderId: string,
    body: EnRouteRequest = {},
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProofTransitionResponse>(
      proofEndpoints.enRoute(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  deliver(
    orderId: string,
    body: DeliverProofRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProofTransitionResponse>(
      proofEndpoints.deliver(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  cashReceipt(
    orderId: string,
    body: CashReceiptRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProofTransitionResponse>(
      proofEndpoints.cashReceipt(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  complete(orderId: string, options?: AuthRequestOptions) {
    return apiRequest<ProofTransitionResponse>(
      proofEndpoints.complete(orderId),
      withAuth({ ...options, method: 'POST' }),
    );
  },
};

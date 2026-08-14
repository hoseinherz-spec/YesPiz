import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CashAvailabilityResponse,
  InitiatePaymentRequest,
  InitiatePaymentResponse,
} from './payments.dto';
import { paymentsEndpoints } from './payments.endpoint';

export const paymentsClient = {
  cashAvailability(options?: AuthRequestOptions) {
    return apiRequest<CashAvailabilityResponse>(
      paymentsEndpoints.cashAvailability,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  initiate(body: InitiatePaymentRequest, options?: AuthRequestOptions) {
    return apiRequest<InitiatePaymentResponse>(
      paymentsEndpoints.initiate,
      withAuth({ ...options, method: 'POST', body }),
    );
  },
};

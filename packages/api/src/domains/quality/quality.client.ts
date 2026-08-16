import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CreateTestOrderRequest,
  KitchenQualityView,
  ProviderQualityView,
  RecordQualityIncidentRequest,
  SubmitChecklistRequest,
  SubmitReadyPhotoRequest,
  SubmitSealRequest,
  UnsuspendProviderRequest,
} from './quality.dto';
import { qualityEndpoints } from './quality.endpoint';

export const qualityClient = {
  getMe(options?: AuthRequestOptions) {
    return apiRequest<ProviderQualityView>(
      qualityEndpoints.me,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  getProvider(id: string, options?: AuthRequestOptions) {
    return apiRequest<ProviderQualityView>(
      qualityEndpoints.provider(id),
      withAuth({ ...options, method: 'GET' }),
    );
  },

  submitChecklist(
    orderId: string,
    body: SubmitChecklistRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<KitchenQualityView>(
      qualityEndpoints.checklist(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  submitSeal(
    orderId: string,
    body: SubmitSealRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<KitchenQualityView>(
      qualityEndpoints.seal(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  submitReadyPhoto(
    orderId: string,
    body: SubmitReadyPhotoRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<KitchenQualityView>(
      qualityEndpoints.readyPhoto(orderId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  recordIncident(
    providerId: string,
    body: RecordQualityIncidentRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProviderQualityView>(
      qualityEndpoints.incidents(providerId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  unsuspend(
    providerId: string,
    body: UnsuspendProviderRequest = {},
    options?: AuthRequestOptions,
  ) {
    return apiRequest<ProviderQualityView>(
      qualityEndpoints.unsuspend(providerId),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  createTestOrder(body: CreateTestOrderRequest, options?: AuthRequestOptions) {
    return apiRequest<unknown>(
      qualityEndpoints.testOrders,
      withAuth({ ...options, method: 'POST', body }),
    );
  },
};

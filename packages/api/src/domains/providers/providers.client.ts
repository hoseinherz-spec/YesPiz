import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CreateProviderRequest,
  EightySixRequest,
  PauseOrdersRequest,
  Provider,
  ProviderSelfUpdateRequest,
  UpdateProviderRequest,
} from './providers.dto';
import { providersEndpoints } from './providers.endpoint';

export const providersClient = {
  create(body: CreateProviderRequest, options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.list,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  list(options?: AuthRequestOptions) {
    return apiRequest<Provider[]>(
      providersEndpoints.list,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  get(id: string, options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.byId(id),
      withAuth({ ...options, method: 'GET' }),
    );
  },

  update(
    id: string,
    body: UpdateProviderRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Provider>(
      providersEndpoints.byId(id),
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },

  getMeProfile(options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.meProfile,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  updateMeProfile(
    body: ProviderSelfUpdateRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Provider>(
      providersEndpoints.meProfile,
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },

  eightySix(body: EightySixRequest, options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.eightySix,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  clearEightySix(body: EightySixRequest, options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.eightySix,
      withAuth({ ...options, method: 'DELETE', body }),
    );
  },

  pause(body: PauseOrdersRequest, options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.pause,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  resume(options?: AuthRequestOptions) {
    return apiRequest<Provider>(
      providersEndpoints.resume,
      withAuth({ ...options, method: 'POST' }),
    );
  },
};

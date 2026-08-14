import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  CreateProviderRequest,
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
};

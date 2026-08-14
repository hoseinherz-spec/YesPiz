import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type { AppConfig, UpdateAppConfigRequest } from './app-config.dto';
import { appConfigEndpoints } from './app-config.endpoint';

export const appConfigClient = {
  get(options?: AuthRequestOptions) {
    return apiRequest<AppConfig>(
      appConfigEndpoints.root,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  update(body: UpdateAppConfigRequest, options?: AuthRequestOptions) {
    return apiRequest<AppConfig>(
      appConfigEndpoints.root,
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },
};

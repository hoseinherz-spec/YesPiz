import { apiRequest, type ApiRequestOptions } from '../../core/api-helper';
import type { HelloResponse } from './health.dto';
import { healthEndpoints } from './health.endpoint';

export const healthClient = {
  getHello(options?: ApiRequestOptions) {
    return apiRequest<HelloResponse>(healthEndpoints.hello, options);
  },
};

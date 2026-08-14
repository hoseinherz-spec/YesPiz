import {
  apiRequest,
  withAuth,
  type AuthRequestOptions,
} from '../../core';
import type {
  AssignCourierRequest,
  Batch,
  CreateBatchRequest,
  ReduceBatchRequest,
  SuggestBatchRequest,
  SuggestBatchResponse,
} from './batches.dto';
import { batchesEndpoints } from './batches.endpoint';

export const batchesClient = {
  create(body: CreateBatchRequest, options?: AuthRequestOptions) {
    return apiRequest<Batch>(
      batchesEndpoints.list,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  suggest(body: SuggestBatchRequest, options?: AuthRequestOptions) {
    return apiRequest<SuggestBatchResponse>(
      batchesEndpoints.suggest,
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  listForProvider(options?: AuthRequestOptions) {
    return apiRequest<Batch[]>(
      batchesEndpoints.provider,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  listAssigned(options?: AuthRequestOptions) {
    return apiRequest<Batch[]>(
      batchesEndpoints.assigned,
      withAuth({ ...options, method: 'GET' }),
    );
  },

  reduce(
    id: string,
    body: ReduceBatchRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Batch>(
      batchesEndpoints.reduce(id),
      withAuth({ ...options, method: 'PATCH', body }),
    );
  },

  assignCourier(
    id: string,
    body: AssignCourierRequest,
    options?: AuthRequestOptions,
  ) {
    return apiRequest<Batch>(
      batchesEndpoints.assignCourier(id),
      withAuth({ ...options, method: 'POST', body }),
    );
  },

  get(id: string, options?: AuthRequestOptions) {
    return apiRequest<Batch | null>(
      batchesEndpoints.byId(id),
      withAuth({ ...options, method: 'GET' }),
    );
  },
};

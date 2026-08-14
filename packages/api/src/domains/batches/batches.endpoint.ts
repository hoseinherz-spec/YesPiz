export const batchesEndpoints = {
  list: '/api/v1/batches',
  suggest: '/api/v1/batches/suggest',
  provider: '/api/v1/batches/provider',
  assigned: '/api/v1/batches/assigned',
  byId: (id: string) => `/api/v1/batches/${id}`,
  reduce: (id: string) => `/api/v1/batches/${id}/reduce`,
  assignCourier: (id: string) => `/api/v1/batches/${id}/assign-courier`,
} as const;

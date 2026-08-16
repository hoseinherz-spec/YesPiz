export const dispatchEndpoints = {
  broadcast: (orderId: string) =>
    `/api/v1/dispatch/orders/${orderId}/broadcast`,
  resolveWave: (orderId: string) =>
    `/api/v1/dispatch/orders/${orderId}/resolve-wave`,
  offers: '/api/v1/dispatch/offers',
  respond: (orderId: string) => `/api/v1/dispatch/orders/${orderId}/respond`,
  accept: (orderId: string) => `/api/v1/dispatch/orders/${orderId}/accept`,
  reject: (orderId: string) => `/api/v1/dispatch/orders/${orderId}/reject`,
} as const;

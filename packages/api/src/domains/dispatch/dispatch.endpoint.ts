export const dispatchEndpoints = {
  broadcast: (orderId: string) =>
    `/api/v1/dispatch/orders/${orderId}/broadcast`,
  offers: '/api/v1/dispatch/offers',
  accept: (orderId: string) => `/api/v1/dispatch/orders/${orderId}/accept`,
  reject: (orderId: string) => `/api/v1/dispatch/orders/${orderId}/reject`,
} as const;

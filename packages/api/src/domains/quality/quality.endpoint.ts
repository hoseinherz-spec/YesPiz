export const qualityEndpoints = {
  me: '/api/v1/quality/me',
  provider: (id: string) => `/api/v1/quality/providers/${id}`,
  checklist: (orderId: string) => `/api/v1/quality/orders/${orderId}/checklist`,
  seal: (orderId: string) => `/api/v1/quality/orders/${orderId}/seal`,
  readyPhoto: (orderId: string) =>
    `/api/v1/quality/orders/${orderId}/ready-photo`,
  incidents: (providerId: string) =>
    `/api/v1/quality/providers/${providerId}/incidents`,
  unsuspend: (providerId: string) =>
    `/api/v1/quality/providers/${providerId}/unsuspend`,
  testOrders: '/api/v1/quality/test-orders',
} as const;

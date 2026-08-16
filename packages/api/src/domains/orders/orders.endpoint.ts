export const ordersEndpoints = {
  addresses: '/api/v1/orders/addresses',
  address: (id: string) => `/api/v1/orders/addresses/${id}`,
  list: '/api/v1/orders',
  adminAtRisk: '/api/v1/orders/admin/at-risk',
  adminReview: '/api/v1/orders/admin/review',
  adminResolve: (id: string) => `/api/v1/orders/admin/review/${id}`,
  reorder: (orderId: string) => `/api/v1/orders/reorder/${orderId}`,
  kitchen: '/api/v1/orders/kitchen',
  byId: (id: string) => `/api/v1/orders/${id}`,
  courierLocation: (id: string) => `/api/v1/orders/${id}/courier-location`,
  kitchenStatus: (id: string) => `/api/v1/orders/${id}/kitchen-status`,
  failedCash: (id: string) => `/api/v1/orders/${id}/failed-cash`,
} as const;

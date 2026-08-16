export const incidentsEndpoints = {
  report: (orderId: string) => `/api/v1/incidents/orders/${orderId}`,
  me: '/api/v1/incidents/me',
  list: '/api/v1/incidents',
  byId: (id: string) => `/api/v1/incidents/${id}`,
  resolve: (id: string) => `/api/v1/incidents/${id}/resolve`,
} as const;

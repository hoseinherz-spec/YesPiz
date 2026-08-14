export const providersEndpoints = {
  list: '/api/v1/providers',
  byId: (id: string) => `/api/v1/providers/${id}`,
  meProfile: '/api/v1/providers/me/profile',
} as const;

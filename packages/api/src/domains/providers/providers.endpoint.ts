export const providersEndpoints = {
  list: '/api/v1/providers',
  byId: (id: string) => `/api/v1/providers/${id}`,
  meProfile: '/api/v1/providers/me/profile',
  eightySix: '/api/v1/providers/me/eighty-six',
  pause: '/api/v1/providers/me/pause',
  resume: '/api/v1/providers/me/resume',
} as const;

export const catalogEndpoints = {
  menu: '/api/v1/catalog/menu',
  combo: (id: string) => `/api/v1/catalog/combos/${encodeURIComponent(id)}`,
  versions: '/api/v1/catalog/versions',
  version: (id: string) => `/api/v1/catalog/versions/${id}`,
  publish: (id: string) => `/api/v1/catalog/versions/${id}/publish`,
  categories: (id: string) => `/api/v1/catalog/versions/${id}/categories`,
  items: (id: string) => `/api/v1/catalog/versions/${id}/items`,
  updateItem: (itemId: string) => `/api/v1/catalog/items/${itemId}`,
} as const;

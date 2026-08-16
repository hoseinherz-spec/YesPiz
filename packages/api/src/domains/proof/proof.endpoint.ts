export const proofEndpoints = {
  byOrder: (orderId: string) => `/api/v1/proof/orders/${orderId}`,
  codes: (orderId: string) => `/api/v1/proof/orders/${orderId}/codes`,
  pickup: (orderId: string) => `/api/v1/proof/orders/${orderId}/pickup`,
  enRoute: (orderId: string) => `/api/v1/proof/orders/${orderId}/en-route`,
  deliver: (orderId: string) => `/api/v1/proof/orders/${orderId}/deliver`,
  cashReceipt: (orderId: string) =>
    `/api/v1/proof/orders/${orderId}/cash-receipt`,
  complete: (orderId: string) => `/api/v1/proof/orders/${orderId}/complete`,
} as const;

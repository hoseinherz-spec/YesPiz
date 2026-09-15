import { apiRequest, withAuth, type AuthRequestOptions } from "../../core";
export type DeliverySlot = {
  id: string;
  startsAt: string;
  endsAt: string;
  remainingUnits: number;
  remainingOrders: number;
};
export const slotsClient = {
  list: () =>
    apiRequest<DeliverySlot[]>("/api/v1/delivery-slots", { method: "GET" }),
  create: (
    body: {
      startsAt: string;
      endsAt: string;
      capacityUnits: number;
      maxOrders: number;
      leadMinutes: number;
    },
    o?: AuthRequestOptions,
  ) =>
    apiRequest<DeliverySlot>(
      "/api/v1/delivery-slots",
      withAuth({ ...o, method: "POST", body }),
    ),
};

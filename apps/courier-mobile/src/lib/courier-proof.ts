import type { OrderStatus } from "@repo/api";

export type { CourierOrderProofView } from "@repo/api";
import type { CourierOrderProofView } from "@repo/api";

export function isActiveDeliveryStatus(status: OrderStatus): boolean {
  return (
    status === "ASSIGNED_TO_COURIER" ||
    status === "PICKED_UP" ||
    status === "ON_THE_WAY" ||
    status === "DELIVERED"
  );
}

export function parseCourierProofView(raw: unknown): CourierOrderProofView {
  return raw as CourierOrderProofView;
}

export function formatOrderStatus(status: OrderStatus): string {
  return status.replaceAll("_", " ").toLowerCase();
}

import type { DeliveryProof, OrderStatus, PaymentMethod } from '@repo/api';

/** Response shape from GET /proof/orders/:orderId (courier view). */
export type CourierOrderProofView = {
  orderId: string;
  status: OrderStatus;
  pickupCode?: string;
  sealId?: string;
  hasDoorPin?: boolean;
  paymentMethod: PaymentMethod;
  proof?: DeliveryProof | null;
};

export function isActiveDeliveryStatus(status: OrderStatus): boolean {
  return (
    status === 'ASSIGNED_TO_COURIER' ||
    status === 'PICKED_UP' ||
    status === 'ON_THE_WAY' ||
    status === 'DELIVERED'
  );
}

export function parseCourierProofView(raw: unknown): CourierOrderProofView {
  return raw as CourierOrderProofView;
}

export function formatOrderStatus(status: OrderStatus): string {
  return status.replaceAll('_', ' ').toLowerCase();
}

import { ORDER_STATUS_TO_CUSTOMER, OrderStatus } from "../common/enums";
import type { OrderDocument } from "./schemas/order.schema";

const PROVIDER_LEAK_KEYS = [
  "providerId",
  "provider",
  "providerName",
  "providerAddress",
  "providerLogo",
  "logoUrl",
  "address",
  "longitude",
  "latitude",
  "location",
  "coords",
  "coordinates",
  "offers",
] as const;

/**
 * Blind-identity customer projection — never expose provider name/address/coords/logo/id.
 */
export function toCustomerView(order: OrderDocument | Record<string, unknown>) {
  const plain: Record<string, unknown> =
    typeof (order as OrderDocument).toObject === "function"
      ? ((order as OrderDocument).toObject({ virtuals: true }) as Record<
          string,
          unknown
        >)
      : { ...(order as Record<string, unknown>) };

  const status = plain.status as OrderStatus;
  const projection = ORDER_STATUS_TO_CUSTOMER[status] ?? null;
  const lines =
    (plain.lines as Array<Record<string, unknown>> | undefined) ?? [];

  const view: Record<string, unknown> = {
    id: String(plain._id ?? plain.id),
    menuVersion: plain.menuVersion,
    lines: lines.map((line) => ({
      menuItemId: String(line.menuItemId),
      name: line.name,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
    })),
    subtotalCents: plain.subtotalCents,
    deliveryFeeCents: plain.deliveryFeeCents,
    totalCents: plain.totalCents,
    status,
    customerStatus: projection,
    paymentMethod: plain.paymentMethod,
    paymentStatus: plain.paymentStatus,
    addressId: String(plain.addressId),
    notes: plain.notes,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  for (const key of PROVIDER_LEAK_KEYS) {
    delete view[key];
  }

  if (view.provider && typeof view.provider === "object") {
    delete view.provider;
  }

  return view;
}

export function assertBlindIdentity(view: Record<string, unknown>): void {
  for (const key of PROVIDER_LEAK_KEYS) {
    if (key in view && view[key] != null) {
      throw new Error(`Blind identity leak: ${key}`);
    }
  }
}

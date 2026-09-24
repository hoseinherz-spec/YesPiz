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
  "sealId",
  "readyPhotoUrl",
  "checklistAnswers",
  "checklistCompletedAt",
  "isTestOrder",
  "pickupCode",
  "doorPin",
  "proofId",
  "quotedPrepMinutes",
  "prepOverrideMinutes",
  "status",
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

  const handoffStage = projection === "onway" || projection === "driver";

  const view: Record<string, unknown> = {
    id: String(plain._id ?? plain.id),
    menuVersion: plain.menuVersion,
    lines: lines.map((line) => ({
      menuItemId: String(line.menuItemId),
      productId: line.productId ? String(line.productId) : undefined,
      productRevisionId: line.productRevisionId ? String(line.productRevisionId) : undefined,
      productType: line.productType,
      secondHalfItemId: line.secondHalfItemId,
      name: line.name,
      unitPriceCents: line.unitPriceCents,
      quantity: line.quantity,
      size: line.size,
      extras: line.extras,
      variantId: line.variantId,
      selections: line.selections ?? [],
      selectionLabels: line.selectionLabels ?? [],
      ingredientChanges: line.ingredientChanges ?? [],
    })),
    subtotalCents: plain.subtotalCents,
    discountCents: plain.discountCents ?? 0,
    couponCode: plain.couponCode,
    deliveryFeeCents: plain.deliveryFeeCents,
    totalCents: plain.totalCents,
    walletCents: plain.walletCents ?? 0,
    deliveryWindowStart: plain.deliveryWindowStart,
    deliveryWindowEnd: plain.deliveryWindowEnd,
    // Blind: never expose raw kitchen/ops status strings — use customerStatus only
    customerStatus: projection,
    matching: status === OrderStatus.PENDING_OFFERS ? {
      notified: Array.isArray(plain.offers) ? plain.offers.length : 0,
      viewed: Array.isArray(plain.offers) ? plain.offers.filter((offer: { viewedAt?: unknown; respondedAt?: unknown }) => offer.viewedAt || offer.respondedAt).length : 0,
    } : undefined,
    fulfillmentStage: ({
      [OrderStatus.ADMIN_REVIEW]: "review",
      [OrderStatus.EXCEPTION_REPORTED]: "review",
      [OrderStatus.READY_FOR_PICKUP]: "ready",
      [OrderStatus.PICKED_UP]: "picked_up",
      [OrderStatus.ON_THE_WAY]: "onway",
    } as Partial<Record<OrderStatus, string>>)[status] ?? projection,
    orderState: [OrderStatus.CANCELLED, OrderStatus.FAILED_CASH].includes(
      status,
    )
      ? "cancelled"
      : status === OrderStatus.PENDING_PAYMENT
        ? "awaiting_payment"
        : [OrderStatus.COMPLETED, OrderStatus.DELIVERED].includes(status)
          ? "completed"
          : "active",
    paymentMethod: plain.paymentMethod,
    paymentStatus: plain.paymentStatus,
    refundStatus: plain.refundStatus,
    canCancel: [
      OrderStatus.PENDING_PAYMENT,
      OrderStatus.PENDING_OFFERS,
      OrderStatus.SCHEDULED,
    ].includes(status),
    addressId: String(plain.addressId),
    notes: plain.notes,
    leaveAtDoor: Boolean(plain.leaveAtDoor),
    scheduledAt: plain.scheduledAt,
    isScheduled: status === OrderStatus.SCHEDULED,
    deliveryStreet: plain.deliveryStreet,
    deliveryCity: plain.deliveryCity,
    deliveryZipcode: plain.deliveryZipcode,
    deliveryEntrance: plain.deliveryEntrance,
    deliveryFloor: plain.deliveryFloor,
    deliveryUnit: plain.deliveryUnit,
    deliveryInstructions: plain.deliveryInstructions,
    etaPrepMin: plain.etaPrepMin,
    etaPrepMax: plain.etaPrepMax,
    etaDeliveryMin: plain.etaDeliveryMin,
    etaDeliveryMax: plain.etaDeliveryMax,
    etaComputedAt: plain.etaComputedAt,
    promisedDeliveryAt: plain.promisedDeliveryAt,
    compensationCents: plain.compensationCents,
    compensatedAt: plain.compensatedAt,
    hasShortExtraStop: Boolean(plain.hasShortExtraStop),
    requiresDeliveryPin: handoffStage && Boolean(plain.doorPin),
    deliveryPin: handoffStage ? plain.doorPin : undefined,
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

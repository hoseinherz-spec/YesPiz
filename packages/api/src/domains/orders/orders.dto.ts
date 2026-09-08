export type OrderStatus =
  | "DRAFT"
  | "PENDING_PAYMENT"
  | "PENDING_OFFERS"
  | "ACCEPTED_BY_PROVIDER"
  | "PREPARING"
  | "READY_FOR_PICKUP"
  | "ASSIGNED_TO_COURIER"
  | "PICKED_UP"
  | "ON_THE_WAY"
  | "DELIVERED"
  | "COMPLETED"
  | "EXCEPTION_REPORTED"
  | "ADMIN_REVIEW"
  | "CANCELLED"
  | "FAILED_CASH";

export type CustomerOrderProjection =
  "received" | "kitchen" | "preparing" | "driver" | "onway" | "delivered";

export type PaymentMethod = "card" | "cash" | "wallet";

export type PaymentStatus =
  "pending" | "authorized" | "captured" | "failed" | "refunded" | "cancelled";

export type CreateAddressRequest = {
  label: string;
  street: string;
  city?: string;
  zipcode?: string;
  country?: string;
  longitude: number;
  latitude: number;
  isDefault?: boolean;
  entrance?: string;
  floor?: string;
  unit?: string;
  doorCode?: string;
  instructions?: string;
};

export type DeliveryAddress = {
  id: string;
  userId: string;
  label: string;
  street: string;
  city?: string;
  zipcode?: string;
  country?: string;
  longitude: number;
  latitude: number;
  location: { type: "Point"; coordinates: [number, number] };
  isDefault: boolean;
  entrance?: string;
  floor?: string;
  unit?: string;
  doorCode?: string;
  instructions?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderLineRequest = {
  size?: "small" | "medium" | "large";
  extras?: string[];
  menuItemId: string;
  quantity: number;
};

export type OrderQuote = {
  lines: CustomerOrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
};

export type CreateOrderRequest = {
  idempotencyKey?: string;
  menuVersion: number;
  addressId: string;
  paymentMethod: PaymentMethod;
  lines: OrderLineRequest[];
  notes?: string;
  leaveAtDoor?: boolean;
  scheduledAt?: string;
  deliveryEntrance?: string;
  deliveryFloor?: string;
  deliveryUnit?: string;
  deliveryDoorCode?: string;
  deliveryInstructions?: string;
};

export type KitchenStatusUpdate =
  "PREPARING" | "READY_FOR_PICKUP" | "EXCEPTION_REPORTED";

export type UpdateKitchenStatusRequest = {
  status: KitchenStatusUpdate;
};

export type AdminResolveStatus = "ADMIN_REVIEW" | "PREPARING" | "CANCELLED";

export type ResolveAdminReviewRequest = {
  status: AdminResolveStatus;
};

/** Blind courier coords for customer tracking — no provider identity. */
export type CourierLocationView = {
  longitude: number | null;
  latitude: number | null;
  updatedAt: string | null;
};

export type CustomerOrderLine = {
  size?: "small" | "medium" | "large";
  extras?: string[];
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

/** Blind-identity customer projection from orders.sanitizer.toCustomerView */
export type CustomerOrderView = {
  canCancel?: boolean;
  refundStatus?: string;
  id: string;
  menuVersion: number;
  lines: CustomerOrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  orderState: "awaiting_payment" | "active" | "completed" | "cancelled";
  customerStatus: CustomerOrderProjection | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  addressId: string;
  notes?: string;
  leaveAtDoor?: boolean;
  scheduledAt?: string;
  deliveryEntrance?: string;
  deliveryFloor?: string;
  deliveryUnit?: string;
  deliveryInstructions?: string;
  etaPrepMin?: number;
  etaPrepMax?: number;
  etaDeliveryMin?: number;
  etaDeliveryMax?: number;
  etaComputedAt?: string;
  hasShortExtraStop?: boolean;
  requiresDeliveryPin?: boolean;
  deliveryPin?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderLine = {
  size?: "small" | "medium" | "large";
  extras?: string[];
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  prepWeight: number;
};

export type OrderOffer = {
  providerId: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  score: number;
  respondedAt?: string;
};

/** Full order document (provider/ops views, e.g. kitchen-status response) */
export type Order = {
  requiredChecklist?: string[];
  id: string;
  customerId: string;
  menuVersion: number;
  lines: OrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  addressId: string;
  deliveryLongitude?: number;
  deliveryLatitude?: number;
  providerId?: string;
  courierId?: string;
  batchId?: string;
  offers?: OrderOffer[];
  radiusExpanded?: boolean;
  notes?: string;
  sealId?: string | null;
  checklistCompletedAt?: string | null;
  checklistAnswers?: Array<{ item: string; ok: boolean }>;
  readyPhotoUrl?: string | null;
  quotedPrepMinutes?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type DeleteAddressResponse = {
  deleted: true;
};

export type ReorderLinePreview = {
  size: "small" | "medium" | "large";
  extras: string[];
  menuItemId: string;
  name: string;
  quantity: number;
  unitPriceCents: number;
  previousUnitPriceCents: number;
};

export type ReorderChangedLine = ReorderLinePreview & {
  change: "price";
};

export type ReorderUnavailableLine = {
  menuItemId: string;
  name: string;
  quantity: number;
  reason: string;
};

export type ReorderPreviewResponse = {
  sourceOrderId: string;
  menuVersion: number;
  available: ReorderLinePreview[];
  changed: ReorderChangedLine[];
  unavailable: ReorderUnavailableLine[];
  cartLines: Array<{
    size: "small" | "medium" | "large";
    extras: string[];
    menuItemId: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
  }>;
  subtotalCents: number;
  deliveryFeeCents: number;
  estimatedTotalCents: number;
};

export type AtRiskOrderRow = {
  orderId: string;
  status: OrderStatus;
  totalCents: number;
  updatedAt?: string;
  risk: "exception" | "delayed_eta";
  etaDeliveryMax?: number;
  etaComputedAt?: string;
};

export type AtRiskIncidentRow = {
  incidentId: string;
  orderId: string;
  kind: string;
  status: string;
  sos: boolean;
  createdAt?: string;
};

export type AtRiskDashboardResponse = {
  exceptionOrders: AtRiskOrderRow[];
  openIncidents: AtRiskIncidentRow[];
  delayedOrders: AtRiskOrderRow[];
  sosOrderIds: string[];
  summary: {
    exceptionCount: number;
    openIncidentCount: number;
    delayedCount: number;
    sosCount: number;
  };
};

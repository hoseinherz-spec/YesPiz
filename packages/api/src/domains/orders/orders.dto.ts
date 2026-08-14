export type OrderStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PENDING_OFFERS'
  | 'ACCEPTED_BY_PROVIDER'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'ASSIGNED_TO_COURIER'
  | 'PICKED_UP'
  | 'ON_THE_WAY'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'EXCEPTION_REPORTED'
  | 'ADMIN_REVIEW'
  | 'CANCELLED'
  | 'FAILED_CASH';

export type CustomerOrderProjection =
  | 'received'
  | 'kitchen'
  | 'preparing'
  | 'driver'
  | 'onway'
  | 'delivered';

export type PaymentMethod = 'card' | 'cash' | 'wallet';

export type PaymentStatus =
  | 'pending'
  | 'authorized'
  | 'captured'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type CreateAddressRequest = {
  label: string;
  street: string;
  city?: string;
  zipcode?: string;
  country?: string;
  longitude: number;
  latitude: number;
  isDefault?: boolean;
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
  location: { type: 'Point'; coordinates: [number, number] };
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderLineRequest = {
  menuItemId: string;
  quantity: number;
};

export type CreateOrderRequest = {
  menuVersion: number;
  addressId: string;
  paymentMethod: PaymentMethod;
  lines: OrderLineRequest[];
  notes?: string;
};

export type KitchenStatusUpdate =
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'EXCEPTION_REPORTED';

export type UpdateKitchenStatusRequest = {
  status: KitchenStatusUpdate;
};

export type AdminResolveStatus = 'ADMIN_REVIEW' | 'PREPARING' | 'CANCELLED';

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
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
};

/** Blind-identity customer projection from orders.sanitizer.toCustomerView */
export type CustomerOrderView = {
  id: string;
  menuVersion: number;
  lines: CustomerOrderLine[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  status: OrderStatus;
  customerStatus: CustomerOrderProjection | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  addressId: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type OrderLine = {
  menuItemId: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  prepWeight: number;
};

export type OrderOffer = {
  providerId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  score: number;
  respondedAt?: string;
};

/** Full order document (provider/ops views, e.g. kitchen-status response) */
export type Order = {
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
  createdAt?: string;
  updatedAt?: string;
};

export type DeleteAddressResponse = {
  deleted: true;
};

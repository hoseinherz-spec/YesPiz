export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
  PROVIDER = "provider",
  COURIER = "courier",
}

/** Client package historically used `client` for customers. */
export type RoleInput = UserRole | "client";

export function normalizeRole(role: RoleInput | string): UserRole {
  if (role === "client" || role === UserRole.CUSTOMER) {
    return UserRole.CUSTOMER;
  }
  if (Object.values(UserRole).includes(role as UserRole)) {
    return role as UserRole;
  }
  throw new Error(`Invalid role: ${role}`);
}

/** External role string for packages/api compatibility. */
export function toPublicRole(role: UserRole): string {
  return role === UserRole.CUSTOMER ? "client" : role;
}

export enum OrderStatus {
  DRAFT = "DRAFT",
  PENDING_PAYMENT = "PENDING_PAYMENT",
  PENDING_OFFERS = "PENDING_OFFERS",
  ACCEPTED_BY_PROVIDER = "ACCEPTED_BY_PROVIDER",
  PREPARING = "PREPARING",
  READY_FOR_PICKUP = "READY_FOR_PICKUP",
  ASSIGNED_TO_COURIER = "ASSIGNED_TO_COURIER",
  PICKED_UP = "PICKED_UP",
  ON_THE_WAY = "ON_THE_WAY",
  DELIVERED = "DELIVERED",
  COMPLETED = "COMPLETED",
  EXCEPTION_REPORTED = "EXCEPTION_REPORTED",
  ADMIN_REVIEW = "ADMIN_REVIEW",
  CANCELLED = "CANCELLED",
  FAILED_CASH = "FAILED_CASH",
}

export enum CustomerOrderProjection {
  RECEIVED = "received",
  KITCHEN = "kitchen",
  PREPARING = "preparing",
  DRIVER = "driver",
  ONWAY = "onway",
  DELIVERED = "delivered",
}

export const ORDER_STATUS_TO_CUSTOMER: Partial<
  Record<OrderStatus, CustomerOrderProjection>
> = {
  [OrderStatus.PENDING_PAYMENT]: CustomerOrderProjection.RECEIVED,
  [OrderStatus.PENDING_OFFERS]: CustomerOrderProjection.RECEIVED,
  [OrderStatus.ACCEPTED_BY_PROVIDER]: CustomerOrderProjection.KITCHEN,
  [OrderStatus.PREPARING]: CustomerOrderProjection.PREPARING,
  [OrderStatus.READY_FOR_PICKUP]: CustomerOrderProjection.PREPARING,
  [OrderStatus.ASSIGNED_TO_COURIER]: CustomerOrderProjection.DRIVER,
  [OrderStatus.PICKED_UP]: CustomerOrderProjection.ONWAY,
  [OrderStatus.ON_THE_WAY]: CustomerOrderProjection.ONWAY,
  [OrderStatus.DELIVERED]: CustomerOrderProjection.DELIVERED,
  [OrderStatus.COMPLETED]: CustomerOrderProjection.DELIVERED,
  // Blind: never surface kitchen exception wording — stay on kitchen
  [OrderStatus.EXCEPTION_REPORTED]: CustomerOrderProjection.KITCHEN,
  [OrderStatus.ADMIN_REVIEW]: CustomerOrderProjection.KITCHEN,
};

export enum PaymentMethod {
  CARD = "card",
  CASH = "cash",
  WALLET = "wallet",
}

export enum PaymentStatus {
  PENDING = "pending",
  AUTHORIZED = "authorized",
  CAPTURED = "captured",
  FAILED = "failed",
  REFUNDED = "refunded",
  CANCELLED = "cancelled",
}

export enum OfferStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPIRED = "expired",
}

export const MAX_BATCH_SIZE = 3;

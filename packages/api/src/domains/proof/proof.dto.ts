export type CourierOrderProofView = {
  orderId: string;
  status: import("../orders/orders.dto").OrderStatus;
  paymentMethod: import("../orders/orders.dto").PaymentMethod;
  totalCents: number;
  sealId?: string;
  hasDoorPin?: boolean;
  deliveryStreet?: string;
  deliveryCity?: string;
  deliveryZipcode?: string;
  deliveryLongitude?: number;
  deliveryLatitude?: number;
  deliveryEntrance?: string;
  deliveryFloor?: string;
  deliveryUnit?: string;
  deliveryDoorCode?: string;
  deliveryInstructions?: string;
  leaveAtDoor?: boolean;
  pickup?: { address: string; longitude: number; latitude: number };
  proof?: DeliveryProof | null;
};

export type IncidentKind =
  | "crash"
  | "no_answer"
  | "no_pay"
  | "wrong_address"
  | "damaged_pack"
  | "vehicle"
  | "sos";

export type IncidentStatus =
  "open" | "waiting" | "reassigning" | "resolved" | "cancelled";

export type CustodyEvent = {
  at: string;
  kind: string;
  longitude?: number;
  latitude?: number;
  note?: string;
};

export type DeliveryProof = {
  id: string;
  orderId: string;
  courierId: string;
  pickupCodeUsed?: string;
  sealId?: string;
  pickupAt?: string;
  pickupLongitude?: number;
  pickupLatitude?: number;
  doorPinUsed?: string;
  signatureUrl?: string;
  photoUrl?: string;
  deliveredAt?: string;
  deliveryLongitude?: number;
  deliveryLatitude?: number;
  cashReceiptCents?: number;
  cashReceiptAt?: string;
  custodyLog: CustodyEvent[];
  createdAt?: string;
  updatedAt?: string;
};

export type PickupCodesResponse = {
  orderId: string;
  pickupCode: string;
  sealId?: string;
};

export type PickupProofRequest = {
  code: string;
  longitude: number;
  latitude: number;
  sealId?: string;
};

export type EnRouteRequest = {
  longitude?: number;
  latitude?: number;
};

export type DeliverProofRequest = {
  pin?: string;
  signatureUrl?: string;
  photoUrl?: string;
  longitude: number;
  latitude: number;
};

export type CashReceiptRequest = {
  amountCents: number;
};

export type ProofTransitionResponse = {
  orderId: string;
  status: string;
  proofId?: string;
};

export type CreateIncidentRequest = {
  kind: IncidentKind;
  notes?: string;
  longitude?: number;
  latitude?: number;
};

export type ResolveIncidentRequest = {
  status: "resolved" | "cancelled";
  notes?: string;
  replacementCourierId?: string;
};

export type Incident = {
  id: string;
  orderId: string;
  batchId?: string;
  courierId: string;
  kind: IncidentKind;
  status: IncidentStatus;
  notes: string;
  longitude?: number;
  latitude?: number;
  workflow: Record<string, unknown>;
  replacementCourierId?: string;
  resolvedAt?: string;
  resolveNotes?: string;
  createdAt?: string;
  updatedAt?: string;
};

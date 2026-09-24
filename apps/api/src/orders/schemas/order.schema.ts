import type { PizzaSelection } from "../../catalog/customization";
import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import {
  OfferStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../../common/enums";

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderLine {
  @Prop({ type: [MongoSchema.Types.Mixed], default: [] }) ingredientChanges?: Array<{ ingredientId: string; action: 'add' | 'remove'; name: string; portionGrams: number }>;
  @Prop({ type: MongoSchema.Types.ObjectId }) productId?: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId }) productRevisionId?: Types.ObjectId;
  @Prop() productType?: string;
  @Prop({ type: MongoSchema.Types.Mixed }) productSnapshot?: {
    comboComponents?: import("../../catalog/combo").ComboComponent[];
    attributes: Record<string, unknown>;
    attributesSchemaVersion: number;
    variantName?: string;
    preparation?: import('../../catalog/products/product.dto').PreparationProfileDto;
    secondHalf?: { productId?: Types.ObjectId; productRevisionId?: Types.ObjectId; name: string; attributes: Record<string, unknown>; preparation?: import('../../catalog/products/product.dto').PreparationProfileDto };
  };
  @Prop() secondHalfItemId?: string;
  @Prop() pizzaId?: string;
  @Prop() variantId?: string;
  @Prop({ type: [MongoSchema.Types.Mixed], default: [] })
  selections!: PizzaSelection[];
  @Prop({ type: [String], default: [] }) selectionLabels!: string[];
  @Prop({ type: MongoSchema.Types.Mixed }) recipeSnapshot?: {
    inventoryComplete?:boolean;
    recipeIngredients: Array<{ name: string; weightGrams: number }>;
    checklistTemplate: string[];
    requiresNumberedSeal: boolean;
    requiresReadyPhoto: boolean;
    handoffTempC: number;
  };

  @Prop({ type: MongoSchema.Types.ObjectId, required: true })
  menuItemId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  unitPriceCents!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ type: String, enum: ["small", "medium", "large"], default: "medium" })
  size!: "small" | "medium" | "large";

  @Prop({ type: [String], default: [] })
  extras!: string[];

  @Prop({ default: 1 })
  prepWeight!: number;

  @Prop({ default: 0 })
  cookTimeSeconds!: number;
}

const OrderLineSchema = SchemaFactory.createForClass(OrderLine);

@Schema({ _id: false })
export class OrderOffer {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "Provider", required: true })
  providerId!: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(OfferStatus),
    default: OfferStatus.PENDING,
  })
  status!: OfferStatus;

  @Prop({ default: 0 })
  score!: number;

  @Prop()
  expiresAt?: Date;

  @Prop()
  respondedAt?: Date;

  @Prop()
  viewedAt?: Date;

  /** Wave bid: kitchen declared ready */
  @Prop()
  ready?: boolean;

  /** Wave bid: quoted prep minutes */
  @Prop()
  quotedPrepMinutes?: number;
}

const OrderOfferSchema = SchemaFactory.createForClass(OrderOffer);

@Schema({ timestamps: true, collection: "orders" })
export class Order {
  @Prop({type:MongoSchema.Types.Mixed}) loyaltyPolicy?:{version:number;ordersPerReward:number;rewardCents:number;minimumOrderCents:number};
  @Prop() deliverySlotId?: string;
  @Prop() slotHoldUntil?: Date;
  @Prop() deliveryWindowStart?: Date;
  @Prop() deliveryWindowEnd?: Date;
  @Prop({ default: 0 }) walletCents!: number;
  @Prop() acceptedAt?: Date;
  @Prop() preparingAt?: Date;
  @Prop() pickedUpAt?: Date;

  @Prop() couponCode?: string;
  @Prop({ default: 0 }) discountCents!: number;
  @Prop()
  campaignCode?: string;

  @Prop() cancellationReason?: string;
  @Prop() cancelledBy?: string;
  @Prop() refundStatus?: string;

  @Prop()
  idempotencyKey?: string;

  @Prop()
  checkoutFingerprint?: string;

  @Prop()
  deliveryStreet?: string;

  @Prop()
  deliveryCity?: string;

  @Prop()
  deliveryZipcode?: string;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  customerId!: Types.ObjectId;

  @Prop({ required: true })
  menuVersion!: number;

  @Prop({ type: [OrderLineSchema], default: [] })
  lines!: OrderLine[];

  @Prop({ required: true })
  subtotalCents!: number;

  @Prop({ default: 0 })
  deliveryFeeCents!: number;

  @Prop({ required: true })
  totalCents!: number;

  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.DRAFT,
  })
  status!: OrderStatus;

  @Prop({ type: String, enum: Object.values(PaymentMethod), required: true })
  paymentMethod!: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus!: PaymentStatus;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "DeliveryAddress",
    required: true,
  })
  addressId!: Types.ObjectId;

  @Prop()
  deliveryLongitude?: number;

  @Prop()
  deliveryLatitude?: number;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "Provider" })
  providerId?: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User" })
  courierId?: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "Batch" })
  batchId?: Types.ObjectId;

  @Prop({ type: [OrderOfferSchema], default: [] })
  offers!: OrderOffer[];

  @Prop({ default: false })
  radiusExpanded!: boolean;

  /** How many times the wave was expanded (N + radius) */
  @Prop({ default: 0 })
  waveExpandCount!: number;

  @Prop()
  notes?: string;

  /** Kitchen Quality OS — numbered seal on package */
  @Prop()
  sealId?: string;

  @Prop()
  checklistCompletedAt?: Date;

  @Prop({
    type: [
      {
        item: { type: String, required: true },
        ok: { type: Boolean, required: true },
      },
    ],
    default: [],
  })
  checklistAnswers!: Array<{ item: string; ok: boolean }>;

  @Prop()
  readyPhotoUrl?: string;

  @Prop({ default: false })
  isTestOrder!: boolean;

  /** Winning kitchen quoted prep (minutes) */
  @Prop()
  quotedPrepMinutes?: number;

  /** Kitchen per-order prep override */
  @Prop()
  prepOverrideMinutes?: number;

  /** Server ETA window — customer-facing ranges */
  @Prop()
  etaPrepMin?: number;

  @Prop()
  etaPrepMax?: number;

  @Prop()
  etaDeliveryMin?: number;

  @Prop()
  etaDeliveryMax?: number;

  @Prop()
  etaComputedAt?: Date;

  /** Pickup QR / OTP shown to kitchen + courier */
  @Prop()
  pickupCode?: string;

  /** Door PIN for customer handoff */
  @Prop()
  doorPin?: string;

  /** Customer sees “courier has one short stop” only */
  @Prop({ default: false })
  hasShortExtraStop!: boolean;

  /** When order became READY_FOR_PICKUP */
  @Prop()
  readyAt?: Date;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "DeliveryProof" })
  proofId?: Types.ObjectId;

  @Prop({ default: false })
  leaveAtDoor!: boolean;

  @Prop()
  scheduledAt?: Date;

  @Prop()
  deliveryEntrance?: string;

  @Prop()
  deliveryFloor?: string;

  @Prop()
  deliveryUnit?: string;

  @Prop()
  deliveryDoorCode?: string;

  @Prop()
  deliveryInstructions?: string;

  /** SLA auto-compensation granted once when delivery missed ETA max. */
  @Prop()
  compensationCents?: number;

  @Prop()
  compensatedAt?: Date;

  @Prop()
  promisedDeliveryAt?: Date;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  completedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: { idempotencyKey: { $type: "string" } },
  },
);
OrderSchema.index({ providerId: 1, status: 1 });

OrderSchema.index({ deliverySlotId: 1, status: 1, slotHoldUntil: 1 });
OrderSchema.index({ providerId: 1, createdAt: -1, preparingAt: 1, readyAt: 1 });

// Used by live customer GPS invalidations and rider completion counts.
OrderSchema.index({ courierId: 1, status: 1 });

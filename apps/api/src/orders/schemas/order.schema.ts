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
  @Prop({ type: Types.ObjectId, required: true })
  menuItemId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  unitPriceCents!: number;

  @Prop({ required: true, min: 1 })
  quantity!: number;

  @Prop({ default: 1 })
  prepWeight!: number;
}

const OrderLineSchema = SchemaFactory.createForClass(OrderLine);

@Schema({ _id: false })
export class OrderOffer {
  @Prop({ type: Types.ObjectId, ref: "Provider", required: true })
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
}

const OrderOfferSchema = SchemaFactory.createForClass(OrderOffer);

@Schema({ timestamps: true, collection: "orders" })
export class Order {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
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

  @Prop({ type: Types.ObjectId, ref: "DeliveryAddress", required: true })
  addressId!: Types.ObjectId;

  @Prop()
  deliveryLongitude?: number;

  @Prop()
  deliveryLatitude?: number;

  @Prop({ type: Types.ObjectId, ref: "Provider" })
  providerId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User" })
  courierId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Batch" })
  batchId?: Types.ObjectId;

  @Prop({ type: [OrderOfferSchema], default: [] })
  offers!: OrderOffer[];

  @Prop({ default: false })
  radiusExpanded!: boolean;

  @Prop()
  notes?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ providerId: 1, status: 1 });

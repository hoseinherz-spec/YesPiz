import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../../common/enums";

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true, collection: "payments" })
export class Payment {
  @Prop({ default: 0 }) walletCents!: number;

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "Order",
    required: true,
  })
  orderId!: Types.ObjectId;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User", required: true })
  customerId!: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(PaymentMethod), required: true })
  method!: PaymentMethod;

  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  status!: PaymentStatus;

  @Prop({ required: true })
  amountCents!: number;

  @Prop({ type: [Object], default: undefined }) groupShares?: {
    userId: string;
    amountCents: number;
    intentId: string;
  }[];
  @Prop() providerRef?: string;
  @Prop() refundId?: string;
  @Prop() refundStatus?: string;
  @Prop() refundError?: string;
  @Prop() refundedAt?: Date;

  @Prop({ default: false })
  mock!: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

PaymentSchema.index(
  { orderId: 1 },
  { unique: true, name: "unique_payment_order" },
);

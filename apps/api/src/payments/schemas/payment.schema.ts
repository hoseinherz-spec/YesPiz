import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { PaymentMethod, PaymentStatus } from "../../common/enums";

export type PaymentDocument = HydratedDocument<Payment>;

@Schema({ timestamps: true, collection: "payments" })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: "Order", required: true, index: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
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

  @Prop()
  providerRef?: string;

  @Prop({ default: false })
  mock!: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);

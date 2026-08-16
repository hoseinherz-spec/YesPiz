import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type DeliveryProofDocument = HydratedDocument<DeliveryProof>;

@Schema({ _id: false })
export class CustodyEvent {
  @Prop({ required: true })
  at!: Date;

  @Prop({ required: true })
  event!: string;

  @Prop({ type: Types.ObjectId, ref: "User" })
  courierId?: Types.ObjectId;

  @Prop()
  longitude?: number;

  @Prop()
  latitude?: number;

  @Prop()
  note?: string;
}

const CustodyEventSchema = SchemaFactory.createForClass(CustodyEvent);

@Schema({ timestamps: true, collection: "delivery_proofs" })
export class DeliveryProof {
  @Prop({ type: Types.ObjectId, ref: "Order", required: true, unique: true })
  orderId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  courierId!: Types.ObjectId;

  @Prop()
  sealId?: string;

  @Prop()
  pickupCodeUsed?: string;

  @Prop()
  pickupAt?: Date;

  @Prop()
  pickupLongitude?: number;

  @Prop()
  pickupLatitude?: number;

  @Prop()
  doorPinUsed?: string;

  @Prop()
  signatureUrl?: string;

  @Prop()
  dropoffPhotoUrl?: string;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  dropoffLongitude?: number;

  @Prop()
  dropoffLatitude?: number;

  @Prop()
  cashReceiptAmountCents?: number;

  @Prop()
  cashReceiptAt?: Date;

  @Prop({ type: [CustodyEventSchema], default: [] })
  custodyLog!: CustodyEvent[];
}

export const DeliveryProofSchema = SchemaFactory.createForClass(DeliveryProof);

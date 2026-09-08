import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type AddressDocument = HydratedDocument<DeliveryAddress>;

@Schema({ timestamps: true, collection: "addresses" })
export class DeliveryAddress {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  label!: string;

  @Prop({ required: true })
  street!: string;

  @Prop()
  city?: string;

  @Prop()
  zipcode?: string;

  @Prop()
  country?: string;

  @Prop({ required: true })
  longitude!: number;

  @Prop({ required: true })
  latitude!: number;

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: { type: [Number], required: true },
  })
  location!: { type: "Point"; coordinates: [number, number] };

  @Prop({ default: false })
  isDefault!: boolean;

  @Prop()
  entrance?: string;

  @Prop()
  floor?: string;

  @Prop()
  unit?: string;

  @Prop()
  doorCode?: string;

  @Prop()
  instructions?: string;
}

export const DeliveryAddressSchema =
  SchemaFactory.createForClass(DeliveryAddress);
DeliveryAddressSchema.index({ location: "2dsphere" });

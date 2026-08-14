import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProviderDocument = HydratedDocument<Provider>;

@Schema({ timestamps: true, collection: "providers" })
export class Provider {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop({ required: true })
  address!: string;

  @Prop()
  logoUrl?: string;

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

  @Prop({ default: 4.5, min: 0, max: 5 })
  rating!: number;

  @Prop({ default: 0 })
  openOrders!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: true })
  acceptingOrders!: boolean;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
ProviderSchema.index({ location: "2dsphere" });

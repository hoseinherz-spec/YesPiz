import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type ProviderDocument = HydratedDocument<Provider>;

@Schema({ timestamps: true, collection: "providers" })
export class Provider {
  @Prop({ default: false }) hoursEnabled!: boolean;
  @Prop({ default: "Europe/Vienna" }) timezone!: string;
  @Prop({
    type: [{ _id: false, day: Number, opens: String, closes: String }],
    default: [],
  })
  openingHours!: { day: number; opens: string; closes: string }[];
  @Prop({ type: [String], default: [] }) closedDates!: string[];

  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  })
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

  /** Internal Kitchen Quality OS score (0–100). Separate from admin `rating`. */
  @Prop({ default: 100, min: 0, max: 100 })
  qualityScore!: number;

  @Prop({ default: 0 })
  complaintCount!: number;

  @Prop({ default: 0 })
  delayCount!: number;

  @Prop({ default: 0 })
  errorCount!: number;

  @Prop({ default: false })
  autoSuspended!: boolean;

  @Prop()
  suspendedAt?: Date;

  @Prop()
  suspendReason?: string;

  /** Max concurrent open orders; null = unlimited */
  @Prop({ default: null, type: Number })
  acceptCap!: number | null;

  @Prop({ default: 0 })
  openOrders!: number;

  /** Menu item ids currently 86'd (unavailable) at this kitchen */
  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: "MenuItem" }],
    default: [],
  })
  eightySixedItemIds!: Types.ObjectId[];

  @Prop()
  pauseReason?: string;

  @Prop()
  pausedUntil?: Date;

  /** Anti-monopoly fairness weight (higher = prefer less-recent winners) */
  @Prop({ default: 1, min: 0, max: 2 })
  fairnessWeight!: number;

  /** Recent accepts used for fairness decay */
  @Prop({ default: 0 })
  recentAcceptCount!: number;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ default: true })
  acceptingOrders!: boolean;
}

export const ProviderSchema = SchemaFactory.createForClass(Provider);
ProviderSchema.index({ location: "2dsphere" });

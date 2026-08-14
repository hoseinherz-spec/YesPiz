import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CourierProfileDocument = HydratedDocument<CourierProfile>;
export type CourierSessionDocument = HydratedDocument<CourierSession>;

@Schema({ timestamps: true, collection: "courier_profiles" })
export class CourierProfile {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  vehicleType?: string;

  @Prop({ default: false })
  onDuty!: boolean;
}

export const CourierProfileSchema =
  SchemaFactory.createForClass(CourierProfile);

@Schema({ timestamps: true, collection: "courier_sessions" })
export class CourierSession {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  courierId!: Types.ObjectId;

  @Prop({ required: true })
  startCode!: string;

  @Prop()
  endCode?: string;

  @Prop()
  startedAt?: Date;

  @Prop()
  endedAt?: Date;

  @Prop({ default: "pending" })
  status!: "pending" | "active" | "ended";

  @Prop()
  lastLongitude?: number;

  @Prop()
  lastLatitude?: number;

  @Prop()
  locationUpdatedAt?: Date;
}

export const CourierSessionSchema =
  SchemaFactory.createForClass(CourierSession);

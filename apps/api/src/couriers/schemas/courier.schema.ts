import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type CourierProfileDocument = HydratedDocument<CourierProfile>;
export type CourierSessionDocument = HydratedDocument<CourierSession>;

@Schema({ timestamps: true, collection: "courier_profiles" })
export class CourierProfile {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  })
  userId!: Types.ObjectId;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  vehicleType?: string;

  @Prop() vehicleModel?: string;
  @Prop() plateNumber?: string;
  @Prop() avatarUrl?: string;
  createdAt?: Date;

  @Prop({ default: false })
  onDuty!: boolean;
}

export const CourierProfileSchema =
  SchemaFactory.createForClass(CourierProfile);

@Schema({ timestamps: true, collection: "courier_sessions" })
export class CourierSession {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  courierId!: Types.ObjectId;

  @Prop()
  startCode?: string;

  @Prop()
  codeExpiresAt?: Date;

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User" })
  issuedBy?: Types.ObjectId;

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

CourierSessionSchema.index(
  { courierId: 1, status: 1 },
  {
    unique: true,
    name: "unique_open_shift",
    partialFilterExpression: { status: { $in: ["active", "pending"] } },
  },
);

import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "../../common/enums";

export type UserDocument = HydratedDocument<User>;

@Schema({ _id: false })
export class UserLocation {
  @Prop()
  address?: string;

  @Prop()
  addressLine2?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  country?: string;

  @Prop()
  zipcode?: string;

  @Prop()
  longitude?: number;

  @Prop()
  latitude?: number;

  @Prop({
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: { type: [Number] },
  })
  coordinates?: { type: "Point"; coordinates: [number, number] };
}

const UserLocationSchema = SchemaFactory.createForClass(UserLocation);

@Schema({ timestamps: true, collection: "users" })
export class User {
  @Prop() stripeConnectedAccountId?: string;
  @Prop({ unique: true, sparse: true }) referralCode?: string;
  @Prop({ required: true, trim: true })
  firstName!: string;

  @Prop({ required: true, trim: true })
  lastName!: string;

  @Prop({ lowercase: true, trim: true, sparse: true, unique: true })
  email?: string;

  @Prop({ trim: true, sparse: true, unique: true })
  phone?: string;

  @Prop()
  passwordHash?: string;

  @Prop({
    type: [String],
    enum: Object.values(UserRole),
    default: [UserRole.CUSTOMER],
  })
  roles!: UserRole[];

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.CUSTOMER,
  })
  activeRole!: UserRole;

  @Prop({ type: UserLocationSchema })
  location?: UserLocation;

  @Prop({ default: true })
  isActive!: boolean;

  @Prop()
  phoneVerifiedAt?: Date;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop({ default: 0 })
  failedCashCount!: number;

  /** Cash Trust Score 0–100; server-owned, never shown as fraud signals to customers. */
  @Prop({ default: 100, min: 0, max: 100 })
  cashTrustScore!: number;

  @Prop({ default: "full" })
  cashTrustTier!: string;

  @Prop({ default: 0, min: 0 })
  creditCents!: number;

  @Prop({
    type: [
      {
        _id: false,
        key: String,
        orderId: String,
        amountCents: Number,
        at: Date,
      },
    ],
    default: [],
  })
  creditEntries!: {
    key: string;
    orderId: string;
    amountCents: number;
    at: Date;
  }[];

  @Prop({ default: false })
  cashBanned!: boolean;

  @Prop()
  cashRestoredAt?: Date;

  @Prop()
  cashRestoreReason?: string;

  @Prop()
  googleSub?: string;

  @Prop({ unique: true, sparse: true })
  appleSub?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ "location.coordinates": "2dsphere" });

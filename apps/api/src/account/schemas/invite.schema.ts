import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { UserRole } from "../../common/enums";

export type InviteDocument = HydratedDocument<Invite>;

export const PRIVILEGED_INVITE_ROLES = [
  UserRole.ADMIN,
  UserRole.PROVIDER,
  UserRole.COURIER,
] as const;

@Schema({ timestamps: true, collection: "invites" })
export class Invite {
  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({
    type: String,
    enum: PRIVILEGED_INVITE_ROLES,
    required: true,
  })
  role!: UserRole;

  @Prop({ lowercase: true, trim: true })
  email?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  createdBy!: Types.ObjectId;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  usedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: "User" })
  usedBy?: Types.ObjectId;
}

export const InviteSchema = SchemaFactory.createForClass(Invite);
InviteSchema.index({ expiresAt: 1 });

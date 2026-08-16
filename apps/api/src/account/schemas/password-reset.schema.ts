import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true, collection: "password_resets" })
export class PasswordReset {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  usedAt?: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

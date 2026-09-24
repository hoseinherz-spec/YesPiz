import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PasswordResetDocument = HydratedDocument<PasswordReset>;

@Schema({ timestamps: true, collection: "password_resets" })
export class PasswordReset {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  })
  userId!: Types.ObjectId;

  @Prop({ required: true, index: true })
  challengeId!: string;

  @Prop({ required: true })
  codeHash!: string;

  @Prop({ default: 0 })
  attempts!: number;

  @Prop({ required: true, unique: true })
  tokenHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop()
  usedAt?: Date;

  @Prop()
  verifiedAt?: Date;
}

export const PasswordResetSchema = SchemaFactory.createForClass(PasswordReset);

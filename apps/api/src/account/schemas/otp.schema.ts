import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { UserRole } from "../../common/enums";

export type OtpChallengeDocument = HydratedDocument<OtpChallenge>;

@Schema({ timestamps: true, collection: "otp_challenges" })
export class OtpChallenge {
  @Prop({ required: true })
  phone!: string;

  @Prop({ type: String, enum: Object.values(UserRole), required: true })
  role!: UserRole;

  @Prop({ required: true })
  codeHash!: string;

  @Prop({ required: true })
  expiresAt!: Date;

  @Prop({ default: 0 })
  attempts!: number;
}

export const OtpChallengeSchema = SchemaFactory.createForClass(OtpChallenge);
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

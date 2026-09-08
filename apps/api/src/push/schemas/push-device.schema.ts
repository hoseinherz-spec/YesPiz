import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
export type PushDeviceDocument = HydratedDocument<PushDevice>;
@Schema({ timestamps: true, collection: "push_devices" })
export class PushDevice {
  @Prop({ required: true, expires: 0 }) expiresAt!: Date;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true, index: true })
  userId!: Types.ObjectId;
  @Prop({ required: true, unique: true }) token!: string;
  @Prop({ required: true }) platform!: string;
}
export const PushDeviceSchema = SchemaFactory.createForClass(PushDevice);

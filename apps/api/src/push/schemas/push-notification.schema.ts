import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type PushNotificationDocument = HydratedDocument<PushNotification>;

@Schema({ timestamps: true, collection: "push_notifications" })
export class PushNotification {
  @Prop({ type: Types.ObjectId, ref: "User", index: true })
  userId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Provider", index: true })
  providerId?: Types.ObjectId;

  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  body!: string;

  @Prop({ type: Object, default: {} })
  data!: Record<string, string>;

  @Prop({ default: "dev" })
  channel!: "dev" | "fcm" | "stub";
}

export const PushNotificationSchema =
  SchemaFactory.createForClass(PushNotification);
PushNotificationSchema.index({ createdAt: -1 });

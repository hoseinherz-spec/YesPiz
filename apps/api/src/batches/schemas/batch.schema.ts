import { Schema as MongoSchema } from "mongoose";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";

export type BatchDocument = HydratedDocument<Batch>;

@Schema({ timestamps: true, collection: "batches" })
export class Batch {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "Provider",
    required: true,
    index: true,
  })
  providerId!: Types.ObjectId;

  @Prop({
    type: [{ type: MongoSchema.Types.ObjectId, ref: "Order" }],
    default: [],
  })
  orderIds!: Types.ObjectId[];

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User" })
  courierId?: Types.ObjectId;

  @Prop({ default: "open" })
  status!: "open" | "assigned" | "in_progress" | "completed" | "cancelled";

  @Prop({ default: 0 })
  totalPrepWeight!: number;

  @Prop({ default: 8 })
  maxHoldMinutes!: number;
}

export const BatchSchema = SchemaFactory.createForClass(Batch);

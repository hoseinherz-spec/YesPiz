import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Schema as MongoSchema, Types } from "mongoose";

@Schema({ timestamps: true, collection: "order_feedback" })
export class OrderFeedback {
  @Prop({
    type: MongoSchema.Types.ObjectId,
    ref: "Order",
    required: true,
    unique: true,
  })
  orderId!: Types.ObjectId;
  @Prop({ default: false }) allowPublication!: boolean;
  @Prop({ type: [{ _id: false, id: String, name: String }], default: [] })
  pizzaItems!: { id: string; name: string }[];
  @Prop({ default: false }) published!: boolean;
  @Prop() publishedPizzaId?: string;
  @Prop() publishedText?: string;
  @Prop() publishedAt?: Date;
  @Prop({ default: 0 }) moderationRevision!: number;
  @Prop({
    type: [
      {
        _id: false,
        actorId: String,
        at: Date,
        published: Boolean,
        pizzaId: String,
        text: String,
      },
    ],
    default: [],
  })
  moderationHistory!: {
    actorId: string;
    at: Date;
    published: boolean;
    pizzaId: string;
    text: string;
  }[];

  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User", required: true })
  customerId!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "Provider", required: true })
  providerId!: Types.ObjectId;
  @Prop({ min: 1, max: 5, required: true }) taste!: number;
  @Prop({ min: 1, max: 5, required: true }) temperature!: number;
  @Prop({ min: 1, max: 5, required: true }) packaging!: number;
  @Prop({ min: 1, max: 5, required: true }) delivery!: number;
  @Prop({ default: "", maxlength: 2000 }) comment!: string;
  @Prop({ required: true }) wouldOrderAgain!: boolean;
}
export type OrderFeedbackDocument = HydratedDocument<OrderFeedback>;
export const OrderFeedbackSchema = SchemaFactory.createForClass(OrderFeedback);
OrderFeedbackSchema.index({
  publishedPizzaId: 1,
  published: 1,
  publishedAt: -1,
});
OrderFeedbackSchema.index({ providerId: 1, createdAt: -1 });

@Schema({ _id: false })
export class CareEvent {
  @Prop({ required: true }) at!: Date;
  @Prop({ required: true }) action!: string;
  @Prop({ type: MongoSchema.Types.ObjectId }) actorId?: Types.ObjectId;
  @Prop({ default: "" }) internalNote!: string;
}

@Schema({ timestamps: true, collection: "support_cases" })
export class SupportCase {
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "Order", required: true })
  orderId!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User", required: true })
  customerId!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "Provider" })
  providerId?: Types.ObjectId;
  @Prop({ required: true }) category!: string;
  @Prop({ required: true, maxlength: 2000 }) message!: string;
  @Prop({ required: true }) requestKey!: string;
  @Prop({ default: "open" }) status!: "open" | "investigating" | "resolved";
  @Prop({ default: "received" }) response!: string;
  @Prop({ type: MongoSchema.Types.ObjectId, ref: "User" })
  ownerId?: Types.ObjectId;
  @Prop({ required: true }) dueAt!: Date;
  @Prop({ default: 0 }) revision!: number;
  @Prop({ type: [SchemaFactory.createForClass(CareEvent)], default: [] })
  events!: CareEvent[];
}
export type SupportCaseDocument = HydratedDocument<SupportCase>;
export const SupportCaseSchema = SchemaFactory.createForClass(SupportCase);
SupportCaseSchema.index({ customerId: 1, requestKey: 1 }, { unique: true });
SupportCaseSchema.index({ status: 1, dueAt: 1 });

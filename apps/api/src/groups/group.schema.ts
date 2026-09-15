import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongoSchema, type HydratedDocument } from "mongoose";
import type { CreateOrderDto, OrderLineDto } from "../orders/dto/order.dto";
export type GroupMember = {
  userId: string;
  name: string;
  lines: OrderLineDto[];
  paid: boolean;
  shareCents: number;
};
@Schema({ timestamps: true, collection: "group_carts" })
export class GroupCart {
  @Prop({ required: true, unique: true }) token!: string;
  @Prop({ required: true }) ownerId!: string;
  @Prop({ required: true }) title!: string;
  @Prop({ required: true }) menuVersion!: number;
  @Prop({ default: false }) split!: boolean;
  @Prop({ default: "open" }) state!:
    "open" | "locked" | "ordered" | "cancelled";
  @Prop({ default: 0 }) revision!: number;
  @Prop({ required: true }) deadline!: Date;
  @Prop({ type: [MongoSchema.Types.Mixed], default: [] })
  members!: GroupMember[];
  @Prop({ type: MongoSchema.Types.Mixed }) checkout?: CreateOrderDto;
  @Prop({ type: MongoSchema.Types.Mixed }) quote?: Record<string, unknown>;
  @Prop() orderId?: string;
}
export type GroupCartDocument = HydratedDocument<GroupCart>;
export const GroupCartSchema = SchemaFactory.createForClass(GroupCart);
GroupCartSchema.index({ ownerId: 1, createdAt: -1 });

GroupCartSchema.index({ "members.userId": 1, createdAt: -1 });

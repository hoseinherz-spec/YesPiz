import { Body, Controller, Get, Module, Post, UseGuards } from "@nestjs/common";
import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from "@nestjs/mongoose";
import { Model, type HydratedDocument } from "mongoose";
import { IsIn, IsUUID } from "class-validator";
import { Throttle } from "@nestjs/throttler";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole, OrderStatus } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
export const FUNNEL_EVENTS = [
  "menu_view",
  "product_view",
  "cart_add",
  "cart_view",
  "checkout_view",
  "payment_view",
] as const;
class EventDto {
  @IsUUID() eventId!: string;
  @IsUUID() sessionId!: string;
  @IsIn(FUNNEL_EVENTS) event!: (typeof FUNNEL_EVENTS)[number];
}
@Schema({ collection: "product_events" })
class ProductEvent {
  @Prop({ required: true, unique: true }) eventId!: string;
  @Prop({ required: true }) sessionId!: string;
  @Prop({ required: true }) event!: string;
  @Prop({ default: Date.now, expires: 2592000 }) at!: Date;
}
const ProductEventSchema = SchemaFactory.createForClass(ProductEvent);
ProductEventSchema.index({ at: -1, event: 1 });
@Controller("insights")
class InsightsController {
  constructor(
    @InjectModel(ProductEvent.name)
    private readonly events: Model<HydratedDocument<ProductEvent>>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
  ) {}
  @Post("events") @Throttle({ default: { limit: 30, ttl: 60000 } }) async event(
    @Body() dto: EventDto,
  ) {
    await this.events.updateOne(
      { eventId: dto.eventId },
      { $setOnInsert: dto },
      { upsert: true },
    );
    return { accepted: true };
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async summary() {
    const since = new Date(Date.now() - 30 * 86400000);
    const [funnel, orders, kitchens, atRisk, customerTotals] =
      await Promise.all([
        this.events.aggregate([
          { $match: { at: { $gte: since } } },
          { $group: { _id: { event: "$event", session: "$sessionId" } } },
          { $group: { _id: "$_id.event", sessions: { $sum: 1 } } },
        ]),
        this.orders.aggregate([
          { $match: { createdAt: { $gte: since } } },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalCents: { $sum: "$totalCents" },
            },
          },
        ]),
        this.orders.aggregate([
          {
            $match: {
              preparingAt: { $exists: true },
              readyAt: { $exists: true },
              createdAt: { $gte: since },
            },
          },
          {
            $project: {
              providerId: 1,
              prep: {
                $divide: [{ $subtract: ["$readyAt", "$preparingAt"] }, 60000],
              },
              quotedPrepMinutes: 1,
            },
          },
          { $match: { prep: { $gte: 1, $lte: 180 } } },
          {
            $group: {
              _id: "$providerId",
              samples: { $sum: 1 },
              actualPrepMinutes: { $avg: "$prep" },
              quotedPrepMinutes: { $avg: "$quotedPrepMinutes" },
            },
          },
        ]),
        this.orders
          .find({
            status: {
              $nin: [
                OrderStatus.COMPLETED,
                OrderStatus.DELIVERED,
                OrderStatus.CANCELLED,
                OrderStatus.FAILED_CASH,
              ],
            },
            promisedDeliveryAt: { $lt: new Date() },
          })
          .select("status promisedDeliveryAt updatedAt")
          .sort({ promisedDeliveryAt: 1 })
          .limit(50)
          .lean()
          .exec(),
        this.orders.aggregate([
          {
            $match: {
              createdAt: { $gte: since },
              status: { $in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] },
              paymentStatus: "captured",
              isTestOrder: { $ne: true },
            },
          },
          {
            $group: {
              _id: "$customerId",
              orders: { $sum: 1 },
              paidCents: { $sum: "$totalCents" },
            },
          },
          {
            $group: {
              _id: null,
              customers: { $sum: 1 },
              repeatCustomers: {
                $sum: { $cond: [{ $gt: ["$orders", 1] }, 1, 0] },
              },
              orders: { $sum: "$orders" },
              paidCents: { $sum: "$paidCents" },
            },
          },
        ]),
      ]);
    const customers = customerTotals[0] ?? {
      customers: 0,
      repeatCustomers: 0,
      orders: 0,
      paidCents: 0,
    };
    return {
      since,
      funnel,
      orders,
      kitchens,
      atRisk,
      customerMetrics: {
        ...customers,
        averagePaidCents: customers.orders
          ? Math.round(customers.paidCents / customers.orders)
          : 0,
      },
    };
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductEvent.name, schema: ProductEventSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [InsightsController],
})
export class InsightsModule {}

import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus } from "../common/enums";
import { User, UserDocument } from "../account/schemas/user.schema";
import { Order, OrderDocument } from "../orders/schemas/order.schema";

export type SlaEvaluationResult = {
  orderId: string;
  compensated: boolean;
  compensationCents?: number;
  reason?: string;
};

@Injectable()
export class SlaService {
  private readonly logger = new Logger(SlaService.name);

  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly appConfig: AppConfigService,
  ) {}

  /** Idempotent SLA credit when delivery missed the promised window. */
  async evaluateOrder(orderId: string): Promise<SlaEvaluationResult> {
    const order = await this.orders.findById(orderId).exec();
    if (!order) {
      return { orderId, compensated: false, reason: "not_found" };
    }

    if (order.compensatedAt) {
      return {
        orderId,
        compensated: false,
        reason: "already_compensated",
        compensationCents: order.compensationCents ?? 0,
      };
    }

    if (
      order.status !== OrderStatus.COMPLETED &&
      order.status !== OrderStatus.DELIVERED
    ) {
      return { orderId, compensated: false, reason: "not_delivered" };
    }

    const etaMax = order.etaDeliveryMax;
    if (etaMax == null) {
      return { orderId, compensated: false, reason: "no_eta" };
    }

    const base =
      order.etaComputedAt ??
      (order as OrderDocument & { createdAt?: Date }).createdAt;
    if (!base) {
      return { orderId, compensated: false, reason: "no_baseline" };
    }

    const deadline = new Date(base.getTime() + etaMax * 60_000);
    const deliveredAt =
      order.completedAt ??
      (order as OrderDocument & { updatedAt?: Date }).updatedAt ??
      new Date();

    if (deliveredAt.getTime() <= deadline.getTime()) {
      return { orderId, compensated: false, reason: "on_time" };
    }

    const cfg = await this.appConfig.get();
    const creditCents = cfg.slaCompensationCents;

    const updated = await this.orders
      .findOneAndUpdate(
        {
          _id: order._id,
          compensatedAt: { $exists: false },
        },
        {
          $set: {
            compensationCents: creditCents,
            compensatedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();

    if (!updated) {
      return { orderId, compensated: false, reason: "already_compensated" };
    }

    await this.users
      .findByIdAndUpdate(order.customerId, {
        $inc: { creditCents },
      })
      .exec();

    this.logger.log(
      `SLA credit ${creditCents}c for order ${orderId} (deadline ${deadline.toISOString()})`,
    );

    return {
      orderId,
      compensated: true,
      compensationCents: creditCents,
    };
  }

  listCompensated(limit = 50) {
    return this.orders
      .find({ compensatedAt: { $exists: true } })
      .sort({ compensatedAt: -1 })
      .limit(limit)
      .select(
        "customerId totalCents compensationCents compensatedAt status etaDeliveryMax",
      )
      .exec();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async sweepDelayedCompleted() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60_000);
    const candidates = await this.orders
      .find({
        status: OrderStatus.COMPLETED,
        compensatedAt: { $exists: false },
        etaDeliveryMax: { $exists: true },
        updatedAt: { $gte: cutoff },
      })
      .select("_id")
      .limit(100)
      .exec();

    for (const doc of candidates) {
      await this.evaluateOrder(doc.id);
    }
  }
}

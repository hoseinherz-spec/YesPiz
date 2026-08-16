import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";

export type EtaWindow = {
  etaPrepMin: number;
  etaPrepMax: number;
  etaDeliveryMin: number;
  etaDeliveryMax: number;
  etaComputedAt: Date;
};

@Injectable()
export class EtaService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Compute prep + delivery ETA window from quoted prep, cook times, queue, and history.
   * Returns a range — never a single minute.
   */
  async computeForOrder(
    order: OrderDocument,
    opts?: { quotedPrepMinutes?: number; queueDepth?: number },
  ): Promise<EtaWindow> {
    const cfg = await this.config.get();
    const pad = cfg.etaWindowPaddingMinutes ?? 5;

    const cookMinutes = Math.ceil(
      order.lines.reduce(
        (sum, l) => sum + (l.cookTimeSeconds || 0) * l.quantity,
        0,
      ) / 60,
    );

    const quoted =
      opts?.quotedPrepMinutes ??
      order.prepOverrideMinutes ??
      order.quotedPrepMinutes ??
      null;

    const historyPrep = await this.medianHistoricalPrepMinutes(
      order.providerId ? String(order.providerId) : null,
    );

    const hour = new Date().getHours();
    const rushFactor = hour >= 11 && hour <= 14 ? 1.15 : hour >= 17 && hour <= 21 ? 1.2 : 1;

    const queueDepth = opts?.queueDepth ?? 0;
    const queueExtra = Math.min(12, queueDepth * 3);

    let prepMid =
      quoted ??
      Math.round(
        (historyPrep ?? cfg.etaBasePrepMinutes ?? 18) * rushFactor +
          cookMinutes * 0.25 +
          queueExtra,
      );
    prepMid = Math.max(8, prepMid);

    const deliveryMid = Math.round(
      (cfg.etaBaseDeliveryMinutes ?? 22) * rushFactor,
    );

    const window: EtaWindow = {
      etaPrepMin: Math.max(5, prepMid - pad),
      etaPrepMax: prepMid + pad,
      etaDeliveryMin: Math.max(8, deliveryMid - pad),
      etaDeliveryMax: deliveryMid + pad,
      etaComputedAt: new Date(),
    };

    order.etaPrepMin = window.etaPrepMin;
    order.etaPrepMax = window.etaPrepMax;
    order.etaDeliveryMin = window.etaDeliveryMin;
    order.etaDeliveryMax = window.etaDeliveryMax;
    order.etaComputedAt = window.etaComputedAt;
    if (quoted != null) order.quotedPrepMinutes = quoted;

    return window;
  }

  async applyAndSave(
    order: OrderDocument,
    opts?: { quotedPrepMinutes?: number; queueDepth?: number },
  ) {
    await this.computeForOrder(order, opts);
    await order.save();
    return order;
  }

  private async medianHistoricalPrepMinutes(
    providerId: string | null,
  ): Promise<number | null> {
    if (!providerId) return null;
    const recent = await this.orders
      .find({
        providerId: new Types.ObjectId(providerId),
        status: {
          $in: [
            OrderStatus.COMPLETED,
            OrderStatus.DELIVERED,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.ASSIGNED_TO_COURIER,
            OrderStatus.PICKED_UP,
            OrderStatus.ON_THE_WAY,
          ],
        },
        quotedPrepMinutes: { $exists: true, $ne: null },
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("quotedPrepMinutes")
      .exec();

    const values = recent
      .map((o) => o.quotedPrepMinutes)
      .filter((v): v is number => typeof v === "number" && v > 0)
      .sort((a, b) => a - b);
    if (!values.length) return null;
    return values[Math.floor(values.length / 2)]!;
  }
}

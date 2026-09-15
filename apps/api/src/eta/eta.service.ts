import { RoutingService } from "./routing.service";
import { Injectable, Optional } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";

import {
  Provider,
  ProviderDocument,
} from "../providers/schemas/provider.schema";

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
    @Optional()
    @InjectModel(Provider.name)
    private readonly providers?: Model<ProviderDocument>,
    @Optional() private readonly routing?: RoutingService,
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

    const provider =
      this.providers && order.providerId
        ? await this.providers
            .findById(order.providerId)
            .select("longitude latitude timezone")
            .exec()
        : null;
    let hour: number;
    try {
      hour = Number(
        new Intl.DateTimeFormat("en-GB", {
          hour: "numeric",
          hourCycle: "h23",
          timeZone: provider?.timezone || "Europe/Berlin",
        }).format(new Date()),
      );
    } catch {
      hour = new Date().getUTCHours();
    }
    const rushFactor =
      hour >= 11 && hour <= 14 ? 1.15 : hour >= 17 && hour <= 21 ? 1.2 : 1;

    const queueDepth = opts?.queueDepth ?? 0;
    const queueExtra = Math.min(12, queueDepth * 3);

    let prepMid =
      quoted ??
      Math.round(
        (historyPrep ?? cfg.etaBasePrepMinutes ?? 18) * rushFactor +
          cookMinutes * 0.25 +
          queueExtra,
      );
    const ready = [
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED_TO_COURIER,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
      OrderStatus.COMPLETED,
    ].includes(order.status);
    const elapsed = order.preparingAt
      ? Math.max(
          0,
          (Date.now() - new Date(order.preparingAt).getTime()) / 60000,
        )
      : 0;
    prepMid = ready ? 0 : Math.max(3, prepMid - elapsed);

    let deliveryMid = Math.round(
      (cfg.etaBaseDeliveryMinutes ?? 22) * rushFactor,
    );
    const lat = order.deliveryLatitude,
      lng = order.deliveryLongitude;
    if (provider && Number.isFinite(lat) && Number.isFinite(lng)) {
      const rad = Math.PI / 180;
      const a =
        Math.sin(((lat! - provider.latitude) * rad) / 2) ** 2 +
        Math.cos(provider.latitude * rad) *
          Math.cos(lat! * rad) *
          Math.sin(((lng! - provider.longitude) * rad) / 2) ** 2;
      const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      // Conservative distance estimate; never represent this as live road routing.
      deliveryMid = Math.max(
        8,
        Math.round((((km * 1.4) / 18) * 60 + 4) * rushFactor),
      );
    }
    if (
      provider &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      this.routing
    ) {
      const roadMinutes = await this.routing.minutes(provider, {
        latitude: lat!,
        longitude: lng!,
      });
      if (roadMinutes !== null) deliveryMid = Math.max(5, roadMinutes + 4);
    }
    if (order.pickedUpAt)
      deliveryMid = Math.max(
        3,
        deliveryMid -
          Math.floor(
            (Date.now() - new Date(order.pickedUpAt).getTime()) / 60000,
          ),
      );

    const window: EtaWindow = {
      etaPrepMin: ready ? 0 : Math.max(1, prepMid - pad),
      etaPrepMax: ready ? 0 : prepMid + pad,
      etaDeliveryMin:
        (ready ? 0 : Math.max(1, prepMid - pad)) +
        Math.max(1, deliveryMid - pad),
      etaDeliveryMax: prepMid + deliveryMid + pad * (ready ? 1 : 2),
      etaComputedAt: new Date(),
    };

    if (!order.promisedDeliveryAt) {
      order.promisedDeliveryAt = new Date(
        window.etaComputedAt.getTime() + window.etaDeliveryMax * 60_000,
      );
    }
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
        preparingAt: { $exists: true },
        readyAt: { $exists: true },
      })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("preparingAt readyAt")
      .exec();

    const values = recent
      .map(
        (o) =>
          (new Date(o.readyAt!).getTime() -
            new Date(o.preparingAt!).getTime()) /
          60000,
      )
      .filter((v) => Number.isFinite(v) && v >= 1 && v <= 180)
      .sort((a, b) => a - b);
    if (!values.length) return null;
    return values[Math.floor(values.length / 2)]!;
  }
}

import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  PushNotification,
  PushNotificationDocument,
} from "./schemas/push-notification.schema";

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  userId?: string;
  providerId?: string;
};

const MEMORY_CAP = 100;

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);
  private readonly memory: PushPayload[] = [];

  constructor(
    @InjectModel(PushNotification.name)
    private readonly notifications: Model<PushNotificationDocument>,
    private readonly config: ConfigService,
  ) {}

  /** Recent in-memory notifications (dev/debug). */
  recent(limit = 20): PushPayload[] {
    return this.memory.slice(0, limit);
  }

  async notify(payload: PushPayload) {
    const fcmKey = this.config.get<string>("FCM_SERVER_KEY");
    const channel: "dev" | "fcm" | "stub" = fcmKey ? "fcm" : "dev";

    this.memory.unshift(payload);
    if (this.memory.length > MEMORY_CAP) {
      this.memory.length = MEMORY_CAP;
    }

    this.logger.log(
      `[push:${channel}] ${payload.title} — ${payload.body}` +
        (payload.userId ? ` user=${payload.userId}` : "") +
        (payload.providerId ? ` provider=${payload.providerId}` : ""),
    );

    try {
      await this.notifications.create({
        userId: payload.userId ? new Types.ObjectId(payload.userId) : undefined,
        providerId: payload.providerId
          ? new Types.ObjectId(payload.providerId)
          : undefined,
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
        channel: fcmKey ? "stub" : "dev",
      });
    } catch (err) {
      // Mongo optional for push audit — never fail the business path
      this.logger.warn(
        `Failed to persist push notification: ${(err as Error).message}`,
      );
    }

    if (fcmKey) {
      // Stub FCM HTTP call — real FCM wiring needs device tokens + Capacitor
      this.logger.debug(
        `FCM stub (key present): would send to devices for ${JSON.stringify({
          userId: payload.userId,
          providerId: payload.providerId,
        })}`,
      );
    }

    return { ok: true, channel };
  }

  notifyProviderOffer(providerId: string, orderId: string) {
    return this.notify({
      providerId,
      title: "New order offer",
      body: "You have 90 seconds to accept a nearby order.",
      data: { type: "offer.created", orderId },
    });
  }

  notifyCustomerStatus(userId: string, orderId: string, status: string) {
    return this.notify({
      userId,
      title: "Order update",
      body: `Your order is now ${status}`,
      data: { type: "order.status", orderId, status },
    });
  }
}

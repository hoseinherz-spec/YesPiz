import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { GoogleAuth } from "google-auth-library";
import { createHash } from "crypto";
import { Cron } from "@nestjs/schedule";
import { OrderStatus } from "../common/enums";
import {
  Provider,
  ProviderDocument,
} from "../providers/schemas/provider.schema";
import { PushDevice, PushDeviceDocument } from "./schemas/push-device.schema";
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
    @InjectModel(PushDevice.name)
    private readonly devices: Model<PushDeviceDocument>,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
  ) {}

  /** Recent in-memory notifications (dev/debug). */
  recent(limit = 20): PushPayload[] {
    return this.memory.slice(0, limit);
  }

  async inbox(userId: string, before?: string) {
    if (before && !/^[a-f0-9]{24}$/i.test(before))
      throw new BadRequestException("Invalid cursor");
    const owner = { userId: new Types.ObjectId(userId), providerId: null };
    const [rows, unreadCount] = await Promise.all([
      this.notifications
        .find({
          ...owner,
          ...(before ? { _id: { $lt: new Types.ObjectId(before) } } : {}),
        })
        .select("title body data createdAt readAt")
        .sort({ _id: -1 })
        .limit(31)
        .lean()
        .exec(),
      this.notifications.countDocuments({ ...owner, readAt: null }).exec(),
    ]);
    const items = rows.slice(0, 30).map((row) => ({
      id: String(row._id),
      title: row.title,
      body: row.body,
      time: row.createdAt.toISOString(),
      unread: !row.readAt,
      kind: row.data?.orderId
        ? "order"
        : row.data?.type?.startsWith("promo")
          ? "promo"
          : "system",
      data: row.data ?? {},
    }));
    return {
      items,
      unreadCount,
      nextCursor: rows.length > 30 ? items[items.length - 1].id : null,
    };
  }

  async readInbox(userId: string, through: string) {
    if (!/^[a-f0-9]{24}$/i.test(through))
      throw new BadRequestException("Invalid cursor");
    await this.notifications
      .updateMany(
        {
          userId: new Types.ObjectId(userId),
          providerId: null,
          _id: { $lte: new Types.ObjectId(through) },
          readAt: null,
        },
        { $set: { readAt: new Date() } },
      )
      .exec();
    return { ok: true };
  }

  async register(
    userId: string,
    token: string,
    platform: string,
    expires?: number,
  ) {
    if (
      !(await this.devices.exists({ userId, token })) &&
      (await this.devices.countDocuments({ userId })) >= 10
    )
      throw new BadRequestException(
        "Remove an old notification device before adding another.",
      );
    const expiresAt = new Date(
      (expires ?? Math.floor(Date.now() / 1000) + 86400) * 1000,
    );
    await this.devices
      .updateOne(
        { token },
        { $set: { userId, platform, expiresAt } },
        { upsert: true },
      )
      .exec();
    return { registered: true };
  }

  async unregister(userId: string, token: string) {
    await this.devices.deleteOne({ userId, token }).exec();
    return { removed: true };
  }

  async failures() {
    return this.notifications
      .find({ deliveryStatus: "failed" })
      .select("-deliveredTokens")
      .sort({ createdAt: -1 })
      .limit(100)
      .exec();
  }

  async notify(payload: PushPayload) {
    this.memory.unshift(payload);
    if (this.memory.length > MEMORY_CAP) this.memory.pop();
    const project = this.config.get<string>("FCM_PROJECT_ID");
    try {
      await this.notifications.create({
        ...payload,
        data: payload.data ?? {},
        channel: project ? "fcm" : "dev",
        deliveryStatus: project ? "queued" : "disabled",
      });
    } catch {
      this.logger.error("Unable to persist notification.");
    }
    return { ok: true, channel: project ? "fcm" : "dev" };
  }

  @Cron("*/5 * * * * *")
  async deliverQueued() {
    const project = this.config.get<string>("FCM_PROJECT_ID");
    if (!project) return;
    for (let i = 0; i < 20; i++) {
      const notification = await this.notifications
        .findOneAndUpdate(
          {
            deliveryStatus: { $in: ["queued", "sending"] },
            nextAttemptAt: { $lte: new Date() },
          },
          {
            $set: {
              deliveryStatus: "sending",
              nextAttemptAt: new Date(Date.now() + 120_000),
            },
            $inc: { attempts: 1 },
          },
          { new: true },
        )
        .exec();
      if (!notification) break;
      try {
        const userId =
          notification.userId ??
          (notification.providerId
            ? (await this.providers.findById(notification.providerId).exec())
                ?.userId
            : undefined);
        if (!userId) throw new Error("recipient_unavailable");
        const devices = await this.devices
          .find({ userId, expiresAt: { $gt: new Date() } })
          .exec();
        if (!devices.length) throw new Error("no_registered_device");
        const credentialsJson = this.config.get<string>(
          "FCM_SERVICE_ACCOUNT_JSON",
        );
        const auth = new GoogleAuth({
          credentials: credentialsJson
            ? JSON.parse(credentialsJson)
            : undefined,
          scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
        });
        const client = await auth.getClient();
        for (const device of devices) {
          const tokenHash = createHash("sha256")
            .update(device.token)
            .digest("hex");
          if (notification.deliveredTokens.includes(tokenHash)) continue;
          try {
            await client.request({
              url: `https://fcm.googleapis.com/v1/projects/${encodeURIComponent(project)}/messages:send`,
              method: "POST",
              timeout: 10_000,
              data: {
                message: {
                  token: device.token,
                  notification: {
                    title: notification.title,
                    body: notification.body,
                  },
                  data: notification.data,
                  android: { priority: "high" },
                  apns: { payload: { aps: { sound: "default" } } },
                },
              },
            });
            notification.deliveredTokens.push(tokenHash);
            await notification.save();
          } catch (err) {
            const response = (
              err as {
                response?: {
                  data?: {
                    error?: { details?: Array<{ errorCode?: string }> };
                  };
                };
              }
            ).response;
            if (
              response?.data?.error?.details?.some(
                (d) => d.errorCode === "UNREGISTERED",
              )
            ) {
              await this.devices
                .deleteOne({ _id: device._id, token: device.token })
                .exec();
            } else throw new Error("gateway_delivery_failed");
          }
        }
        notification.deliveryStatus = "delivered";
        notification.lastError = undefined;
      } catch (err) {
        notification.lastError =
          err instanceof Error &&
          [
            "recipient_unavailable",
            "no_registered_device",
            "gateway_delivery_failed",
          ].includes(err.message)
            ? err.message
            : "delivery_failed";
        notification.deliveryStatus =
          notification.attempts >= 10 ? "failed" : "queued";
        if (notification.deliveryStatus === "failed")
          this.logger.error(
            `Notification ${notification.id} delivery failed: ${notification.lastError}`,
          );
        notification.nextAttemptAt = new Date(
          Date.now() + Math.min(3600, 2 ** notification.attempts * 5) * 1000,
        );
      }
      await notification.save();
    }
  }

  notifyProviderOffer(providerId: string, orderId: string) {
    return this.notify({
      providerId,
      title: "New order offer",
      body: "Open the kitchen panel to respond before the offer expires.",
      data: { type: "offer.created", orderId },
    });
  }

  notifyCustomerStatus(userId: string, orderId: string, status: string) {
    return this.notify({
      userId,
      title: "Order update",
      body: ({
        [OrderStatus.PENDING_OFFERS]: "Nearby restaurants are reviewing your request.",
        [OrderStatus.ACCEPTED_BY_PROVIDER]: "A restaurant has confirmed your order.",
        [OrderStatus.PREPARING]: "Your food is being freshly prepared.",
        [OrderStatus.READY_FOR_PICKUP]: "Your order is packed and ready for pickup.",
        [OrderStatus.ASSIGNED_TO_COURIER]: "Your rider is getting ready to collect your order.",
        [OrderStatus.PICKED_UP]: "Your order has been handed to your rider.",
        [OrderStatus.ON_THE_WAY]: "Your rider is on the way. Follow their location in the app.",
        [OrderStatus.DELIVERED]: "Your order has arrived. Enjoy every bite!",
        [OrderStatus.COMPLETED]: "Your delivery is complete. Enjoy your meal!",
        [OrderStatus.CANCELLED]: "Your order was cancelled. Open the app for details.",
      } as Partial<Record<OrderStatus, string>>)[status as OrderStatus] ?? "There is an update to your order. Open the app for details.",
      data: { type: "order.status", orderId },
    });
  }
}

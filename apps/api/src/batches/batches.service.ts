import { PushService } from "../push/push.service";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { RedisService } from "../redis/redis.service";
import { randomUUID } from "crypto";
import { CouriersService } from "../couriers/couriers.service";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { MAX_BATCH_SIZE, OrderStatus, PaymentMethod } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { ProofService } from "../proof/proof.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  AssignCourierDto,
  CreateBatchDto,
  ReduceBatchDto,
} from "./dto/batch.dto";
import { Batch, BatchDocument } from "./schemas/batch.schema";

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);
  private splitRunning = false;

  constructor(
    @InjectModel(Batch.name) private readonly batches: Model<BatchDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly redis: RedisService,
    private readonly couriers: CouriersService,
    private readonly appConfig: AppConfigService,
    private readonly proof: ProofService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
  ) {}

  private async locked<T>(key: string, action: () => Promise<T>): Promise<T> {
    const owner = randomUUID();
    if (!(await this.redis.acquireLock(key, owner, 30_000)))
      throw new ConflictException("Please wait for the current batch action.");
    try {
      return await action();
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }

  async create(dto: CreateBatchDto) {
    return this.locked(`batch:create:${dto.providerId}`, () =>
      this.createOnce(dto),
    );
  }

  private async createOnce(dto: CreateBatchDto) {
    const cfg = await this.appConfig.get();
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    if (dto.orderIds.length > max) {
      throw new BadRequestException("errors.badRequest");
    }

    const orders = await this.orders
      .find({
        _id: { $in: dto.orderIds.map((id) => new Types.ObjectId(id)) },
        providerId: new Types.ObjectId(dto.providerId),
        batchId: { $exists: false },
        status: {
          $in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.PREPARING],
        },
      })
      .exec();

    if (orders.length !== dto.orderIds.length) {
      throw new BadRequestException("errors.badRequest");
    }

    const safety = this.evaluateSafety(orders, cfg);
    if (!safety.ok) {
      throw new BadRequestException("errors.badRequest");
    }

    const totalPrepWeight = orders.reduce(
      (sum, o) =>
        sum + o.lines.reduce((s, l) => s + l.prepWeight * l.quantity, 0),
      0,
    );

    const routeOrderIds = this.orderByProximity(orders).map((o) => o._id);

    const batch = await this.batches.create({
      providerId: new Types.ObjectId(dto.providerId),
      orderIds: routeOrderIds,
      totalPrepWeight,
      status: "open",
      maxHoldMinutes: cfg.maxBatchHoldMinutes ?? 8,
    });

    const multi = routeOrderIds.length > 1;
    await this.orders
      .updateMany(
        { _id: { $in: routeOrderIds } },
        { batchId: batch._id, hasShortExtraStop: multi },
      )
      .exec();

    return batch;
  }

  /**
   * Suggest a safe batch: ready orders clustered by proximity + ready-time,
   * respecting max hold, bag time, and cash mix preference.
   */
  async suggest(providerId: string) {
    const cfg = await this.appConfig.get();
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    const maxHoldMs = (cfg.maxBatchHoldMinutes ?? 8) * 60_000;

    const ready = await this.orders
      .find({
        providerId: new Types.ObjectId(providerId),
        status: OrderStatus.READY_FOR_PICKUP,
        $or: [{ batchId: { $exists: false } }, { batchId: null }],
      })
      .sort({ readyAt: 1, createdAt: 1 })
      .exec();

    if (!ready.length) {
      return {
        providerId,
        suggestedOrderIds: [] as string[],
        maxBatchSize: max,
        reason: "none_ready",
      };
    }

    const anchor = ready[0]!;
    const now = Date.now();
    const candidates = ready.filter((o) => {
      const readyAt =
        (o.readyAt as Date | undefined)?.getTime?.() ??
        (o as unknown as { createdAt?: Date }).createdAt?.getTime?.() ??
        now;
      if (now - readyAt > maxHoldMs) return false;
      return true;
    });

    const scored = candidates
      .map((o) => ({
        o,
        dist: this.haversineMeters(
          anchor.deliveryLatitude ?? 0,
          anchor.deliveryLongitude ?? 0,
          o.deliveryLatitude ?? 0,
          o.deliveryLongitude ?? 0,
        ),
      }))
      .sort((a, b) => a.dist - b.dist);

    const picked: OrderDocument[] = [];
    for (const { o, dist } of scored) {
      if (picked.length >= max) break;
      // ~8 min bag ≈ rough 2.5 km at city speeds as soft cap
      if (dist > 2500 && picked.length > 0) continue;
      const trial = [...picked, o];
      if (!this.evaluateSafety(trial, cfg).ok) continue;
      picked.push(o);
    }

    return {
      providerId,
      suggestedOrderIds: picked.map((o) => o.id),
      maxBatchSize: max,
      maxBatchHoldMinutes: cfg.maxBatchHoldMinutes ?? 8,
      hasShortExtraStop: picked.length > 1,
    };
  }

  async reduce(batchId: string, providerId: string, dto: ReduceBatchDto) {
    const batch = await this.batches.findById(batchId).exec();
    if (!batch || String(batch.providerId) !== providerId) {
      throw new NotFoundException("errors.notFound");
    }
    if (batch.status !== "open")
      throw new BadRequestException("Batch has already been assigned.");
    const cfg = await this.appConfig.get();
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    if (dto.keepOrderIds.length > max) {
      throw new BadRequestException("errors.badRequest");
    }

    const keep = new Set(dto.keepOrderIds);
    const removed = batch.orderIds.filter((id) => !keep.has(String(id)));
    batch.orderIds = batch.orderIds.filter((id) => keep.has(String(id)));
    if (batch.orderIds.length === 0) {
      throw new BadRequestException("errors.badRequest");
    }

    if (removed.length) {
      await this.orders
        .updateMany(
          { _id: { $in: removed } },
          { $unset: { batchId: 1 }, $set: { hasShortExtraStop: false } },
        )
        .exec();
    }

    const orders = await this.orders
      .find({ _id: { $in: batch.orderIds } })
      .exec();
    batch.totalPrepWeight = orders.reduce(
      (sum, o) =>
        sum + o.lines.reduce((s, l) => s + l.prepWeight * l.quantity, 0),
      0,
    );
    await batch.save();

    const multi = batch.orderIds.length > 1;
    await this.orders
      .updateMany(
        { _id: { $in: batch.orderIds } },
        { hasShortExtraStop: multi },
      )
      .exec();

    return batch;
  }

  async assignCourier(batchId: string, dto: AssignCourierDto) {
    return this.locked(`batch:${batchId}`, () => this.assignOnce(batchId, dto));
  }

  private async assignOnce(batchId: string, dto: AssignCourierDto) {
    const batch = await this.batches.findById(batchId).exec();
    if (!batch) throw new NotFoundException("errors.notFound");
    if (batch.orderIds.length > MAX_BATCH_SIZE) {
      throw new BadRequestException("errors.badRequest");
    }

    // A lost assignment response must not rewind a collected or delivered group.
    if (["in_progress", "completed"].includes(batch.status) && String(batch.courierId) === dto.courierId) return batch;
    const retry =
      batch.status === "assigned" && String(batch.courierId) === dto.courierId;
    if (!retry && (batch.status !== "open" || batch.courierId))
      throw new BadRequestException("Batch is already assigned.");
    await this.couriers.assertAvailable(dto.courierId);
    const members = await this.orders
      .find({ _id: { $in: batch.orderIds }, batchId: batch._id })
      .exec();
    if (
      members.length !== batch.orderIds.length ||
      members.some(
        (order) =>
          order.status !== OrderStatus.READY_FOR_PICKUP &&
          !(retry && String(order.courierId) === dto.courierId),
      )
    )
      throw new BadRequestException(
        "Every pizza must pass quality checks and be ready before assigning a courier.",
      );
    batch.courierId = new Types.ObjectId(dto.courierId);
    batch.status = "assigned";
    await batch.save();

    await this.orders
      .updateMany(
        {
          _id: { $in: batch.orderIds },
          batchId: batch._id,
          status: OrderStatus.READY_FOR_PICKUP,
        },
        {
          courierId: batch.courierId,
          status: OrderStatus.ASSIGNED_TO_COURIER,
          hasShortExtraStop: batch.orderIds.length > 1,
        },
      )
      .exec();

    const orders = await this.orders
      .find({ _id: { $in: batch.orderIds } })
      .exec();
    for (const order of orders) {
      await this.proof.ensureCodes(order);
      this.realtime.emitOrderStatus(
        order.id,
        String(order.customerId),
        order.status,
      );
      this.realtime.emitToCourier(dto.courierId, "order.status", { orderId: order.id, status: order.status });
      this.realtime.emitToProvider(String(order.providerId), "order.status", { orderId: order.id, status: order.status });
    }

    await this.push.notify({
      userId: dto.courierId,
      title: "Delivery assigned",
      body: "Open the courier app to collect your delivery.",
      data: { type: "batch.assigned", batchId: batch.id },
    });
    return batch;
  }

  /**
   * Auto-split batches when one order has waited past max hold while still assigned.
   */
  async autoSplitStale() {
    const cfg = await this.appConfig.get();
    const maxHoldMs = (cfg.maxBatchHoldMinutes ?? 8) * 60_000;
    const now = Date.now();

    const active = await this.batches
      .find({ status: { $in: ["open", "assigned"] } })
      .exec();

    const results: Array<Record<string, unknown>> = [];
    for (const batch of active) {
      if (batch.orderIds.length <= 1) continue;
      const orders = await this.orders
        .find({ _id: { $in: batch.orderIds } })
        .exec();
      const stale = orders.filter((o) => {
        const readyAt =
          (o.readyAt as Date | undefined)?.getTime?.() ??
          (o as unknown as { createdAt?: Date }).createdAt?.getTime?.() ??
          now;
        return (
          (o.status === OrderStatus.READY_FOR_PICKUP ||
            o.status === OrderStatus.ASSIGNED_TO_COURIER) &&
          now - readyAt > maxHoldMs
        );
      });
      if (!stale.length) continue;

      // Keep freshest non-stale; peel stale into solo
      const keepIds = orders
        .filter((o) => !stale.some((s) => s.id === o.id))
        .map((o) => o._id);
      if (keepIds.length === 0) {
        // All stale — cancel batch membership, leave orders alone
        batch.status = "cancelled";
        await batch.save();
        await this.orders
          .updateMany(
            { _id: { $in: batch.orderIds } },
            { $unset: { batchId: 1 }, $set: { hasShortExtraStop: false } },
          )
          .exec();
        results.push({ batchId: batch.id, action: "cancelled_all_stale" });
        continue;
      }

      const removed = batch.orderIds.filter(
        (id) => !keepIds.some((k) => String(k) === String(id)),
      );
      batch.orderIds = keepIds;
      await batch.save();
      await this.orders
        .updateMany(
          { _id: { $in: removed } },
          { $unset: { batchId: 1 }, $set: { hasShortExtraStop: false } },
        )
        .exec();
      await this.orders
        .updateMany(
          { _id: { $in: keepIds } },
          { hasShortExtraStop: keepIds.length > 1 },
        )
        .exec();
      results.push({
        batchId: batch.id,
        action: "split",
        removed: removed.map(String),
      });
    }
    return results;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoSplitCron() {
    if (this.splitRunning) return;
    this.splitRunning = true;
    try {
      const results = await this.autoSplitStale();
      if (results.length) {
        this.logger.log(`Auto-split ${results.length} batch(es)`);
      }
    } catch (err) {
      this.logger.error(`Auto-split failed: ${(err as Error).message}`);
    } finally {
      this.splitRunning = false;
    }
  }

  get(batchId: string) {
    return this.batches.findById(batchId).exec();
  }

  listForProvider(providerId: string) {
    return this.batches
      .find({ providerId: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  listForCourier(courierUserId: string) {
    return this.batches
      .find({
        courierId: new Types.ObjectId(courierUserId),
        status: { $in: ["assigned", "in_progress", "open"] },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  private evaluateSafety(
    orders: OrderDocument[],
    cfg: { maxBatchSize?: number; maxBatchHoldMinutes?: number },
  ) {
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    if (orders.length > max) return { ok: false, reason: "size" };
    if (orders.length <= 1) return { ok: true };

    // Prefer not mixing many cash stops with online (debt risk)
    const cashCount = orders.filter(
      (o) => o.paymentMethod === PaymentMethod.CASH,
    ).length;
    if (cashCount > 1 && orders.length > 2) {
      return { ok: false, reason: "cash_mix" };
    }

    const maxHoldMs = (cfg.maxBatchHoldMinutes ?? 8) * 60_000;
    const now = Date.now();
    const readyTimes = orders.map(
      (o) =>
        (o.readyAt as Date | undefined)?.getTime?.() ??
        (o as unknown as { createdAt?: Date }).createdAt?.getTime?.() ??
        now,
    );
    const spread = Math.max(...readyTimes) - Math.min(...readyTimes);
    if (spread > maxHoldMs) return { ok: false, reason: "ready_spread" };

    return { ok: true };
  }

  private orderByProximity(orders: OrderDocument[]) {
    if (orders.length <= 1) return orders;
    const remaining = [...orders];
    const route: OrderDocument[] = [remaining.shift()!];
    while (remaining.length) {
      const last = route[route.length - 1]!;
      remaining.sort(
        (a, b) =>
          this.haversineMeters(
            last.deliveryLatitude ?? 0,
            last.deliveryLongitude ?? 0,
            a.deliveryLatitude ?? 0,
            a.deliveryLongitude ?? 0,
          ) -
          this.haversineMeters(
            last.deliveryLatitude ?? 0,
            last.deliveryLongitude ?? 0,
            b.deliveryLatitude ?? 0,
            b.deliveryLongitude ?? 0,
          ),
      );
      route.push(remaining.shift()!);
    }
    return route;
  }

  private haversineMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }
}

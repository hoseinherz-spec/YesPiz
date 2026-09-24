import {
  InventoryService,
  hasIngredients,
} from "../inventory/inventory.module";
import { randomUUID } from "crypto";
import { canReceiveOrder } from "../providers/availability";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Optional,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OfferStatus, OrderStatus, PaymentStatus } from "../common/enums";
import { EtaService } from "../eta/eta.service";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { ProvidersService } from "../providers/providers.service";
import { ProviderDocument } from "../providers/schemas/provider.schema";
import { PushService } from "../push/push.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);
  private expiryRunning = false;

  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly providers: ProvidersService,
    private readonly config: AppConfigService,
    private readonly redis: RedisService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
    private readonly eta: EtaService,
    @Optional() private readonly inventory?: InventoryService,
  ) {}

  async startDispatch(orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.PENDING_OFFERS &&
      order.status !== OrderStatus.SCHEDULED
    ) {
      throw new BadRequestException("errors.badRequest");
    }

    if (order.scheduledAt && order.scheduledAt.getTime() > Date.now()) {
      order.status = OrderStatus.SCHEDULED;
      await order.save();
      return {
        orderId: order.id,
        status: OrderStatus.SCHEDULED,
        offerCount: 0,
      };
    }

    const cfg = await this.config.get();
    const lng = order.deliveryLongitude!;
    const lat = order.deliveryLatitude!;
    const expandCount = order.waveExpandCount ?? 0;
    const radius =
      expandCount > 0
        ? cfg.dispatchExpandedRadiusMeters
        : cfg.dispatchInitialRadiusMeters;

    const requiredItems = order.lines.flatMap((l) => [
      String(l.menuItemId),
      ...(l.secondHalfItemId ? [l.secondHalfItemId] : []),
    ]);
    const nearby = await this.providers.findNearby(
      lng,
      lat,
      radius,
      requiredItems,
    );
    const ranked = this.rankProviders(
      nearby.filter((p) => hasIngredients(p, order.lines)),
      lng,
      lat,
      cfg.w1Rating,
      cfg.w2Proximity,
      cfg.w3QueueEmptiness,
    );

    const waveSize = (cfg.waveSize ?? 3) + expandCount;
    const top = ranked.slice(0, waveSize);
    const bidSeconds = cfg.bidWindowSeconds ?? 15;
    const expiresAt = new Date(Date.now() + bidSeconds * 1000);

    order.offers = top.map((p) => ({
      providerId: p._id as Types.ObjectId,
      status: OfferStatus.PENDING,
      score: p._score,
      expiresAt,
    }));
    // An empty wave has no expiry event. Surface it to operations instead of stranding a paid order.
    order.status = top.length
      ? OrderStatus.PENDING_OFFERS
      : OrderStatus.ADMIN_REVIEW;
    if (expandCount > 0) order.radiusExpanded = true;
    await order.save();

    this.logger.log(
      `Wave ${top.length} bids for order ${orderId} (window ${bidSeconds}s)`,
    );

    for (const offer of order.offers) {
      const providerId = String(offer.providerId);
      this.realtime.emitToProvider(providerId, "offer.created", {
        orderId: order.id,
        providerId,
        expiresAt: expiresAt.toISOString(),
        score: offer.score,
        wave: true,
        bidWindowSeconds: bidSeconds,
      });
      void this.push.notifyProviderOffer(providerId, order.id);
    }
    this.realtime.emitOrderStatus(
      order.id,
      String(order.customerId),
      order.status,
    );

    return {
      orderId: order.id,
      status: order.status,
      offerCount: top.length,
      waveSize,
      bidWindowSeconds: bidSeconds,
      expiresAt: expiresAt.toISOString(),
      offers: order.offers.map((o) => ({
        providerId: String(o.providerId),
        score: o.score,
        status: o.status,
        expiresAt: o.expiresAt?.toISOString(),
      })),
    };
  }

  async markOfferViewed(orderId: string, providerId: string) {
    if (!Types.ObjectId.isValid(orderId)) throw new NotFoundException("errors.notFound");
    // Atomic and idempotent: only the invited restaurant may acknowledge its offer.
    const order = await this.orders.findOneAndUpdate({
      _id: orderId,
      status: OrderStatus.PENDING_OFFERS,
      offers: { $elemMatch: { providerId: new Types.ObjectId(providerId), status: OfferStatus.PENDING, viewedAt: { $exists: false } } },
    }, { $set: { "offers.$.viewedAt": new Date() } }, { new: true }).exec();
    if (order) this.realtime.emitOrderStatus(order.id, String(order.customerId), order.status);
    return { acknowledged: Boolean(order) };
  }

  rankProviders(
    providers: ProviderDocument[],
    lng: number,
    lat: number,
    w1: number,
    w2: number,
    w3: number,
  ): Array<ProviderDocument & { _score: number }> {
    const withDist = providers.map((p) => {
      const dist = this.haversineMeters(lat, lng, p.latitude, p.longitude);
      return { p, dist };
    });
    const maxDist = Math.max(...withDist.map((x) => x.dist), 1);
    const maxQueue = Math.max(...withDist.map((x) => x.p.openOrders), 1);

    return withDist
      .map(({ p, dist }) => {
        const ratingScore = (p.rating ?? 0) / 5;
        const proximityScore = 1 - dist / maxDist;
        const queueEmptiness = 1 - (p.openOrders ?? 0) / maxQueue;
        const score =
          w1 * ratingScore + w2 * proximityScore + w3 * queueEmptiness;
        return Object.assign(p, { _score: score });
      })
      .sort((a, b) => b._score - a._score);
  }

  /**
   * Kitchen declares readiness + quoted prep within the bid window.
   * Server picks the winner after the window (or when all have responded).
   */
  async respondToWave(
    orderId: string,
    providerId: string,
    ready: boolean,
    quotedPrepMinutes?: number,
  ) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (order.status !== OrderStatus.PENDING_OFFERS) {
      throw new BadRequestException("errors.badRequest");
    }
    if (order.providerId) {
      throw new ConflictException("errors.conflict");
    }

    const offer = order.offers.find((o) => String(o.providerId) === providerId);
    if (!offer || offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException("errors.badRequest");
    }
    if (offer.expiresAt && offer.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("errors.badRequest");
    }
    if (offer.respondedAt) {
      throw new ConflictException("errors.conflict");
    }

    if (ready && (quotedPrepMinutes == null || quotedPrepMinutes < 5)) {
      throw new BadRequestException("errors.badRequest");
    }

    offer.respondedAt = new Date();
    offer.ready = ready;
    if (ready) {
      offer.quotedPrepMinutes = quotedPrepMinutes;
    } else {
      offer.status = OfferStatus.REJECTED;
    }
    await order.save();

    const awaiting = order.offers.filter(
      (o) => o.status === OfferStatus.PENDING && !o.respondedAt,
    );
    if (awaiting.length === 0) {
      return this.resolveWave(orderId);
    }

    return {
      orderId: order.id,
      status: order.status,
      ready,
      awaitingResponses: awaiting.length,
    };
  }

  /**
   * Backward-compatible alias: declare ready with a default prep quote.
   * Does NOT claim the order — waits for wave resolution.
   */
  async acceptOffer(orderId: string, providerId: string) {
    return this.respondToWave(orderId, providerId, true, 20);
  }

  async rejectOffer(orderId: string, providerId: string) {
    return this.respondToWave(orderId, providerId, false);
  }

  /**
   * Pick the best ready bidder. Providers never select the winner.
   */
  async resolveWave(orderId: string) {
    const lockKey = `order:wave:${orderId}`;
    const owner = `resolve:${orderId}`;
    const acquired = await this.redis.acquireLock(lockKey, owner, 15_000);
    if (!acquired) {
      throw new ConflictException("errors.conflict");
    }

    try {
      const order = await this.orders.findById(orderId).exec();
      if (!order) throw new NotFoundException("errors.notFound");
      if (order.status !== OrderStatus.PENDING_OFFERS || order.providerId) {
        return {
          orderId,
          status: order?.status,
          skipped: true,
        };
      }

      const cfg = await this.config.get();
      let readyBids = order.offers.filter(
        (o) =>
          o.status === OfferStatus.PENDING &&
          o.ready === true &&
          o.quotedPrepMinutes != null,
      );

      if (readyBids.length === 0) {
        // Expire remaining pending
        for (const o of order.offers) {
          if (o.status === OfferStatus.PENDING) {
            o.status = OfferStatus.EXPIRED;
            o.respondedAt = o.respondedAt ?? new Date();
          }
        }
        await order.save();
        return this.afterNoPendingOffers(order);
      }

      const providerDocs = await Promise.all(
        readyBids.map((b) => this.providers.getById(String(b.providerId))),
      );
      const byId = new Map(providerDocs.map((p) => [p.id, p]));
      readyBids = readyBids.filter((bid) => {
        const provider = byId.get(String(bid.providerId));
        return (
          provider &&
          hasIngredients(provider, order.lines) &&
          canReceiveOrder(
            provider,
            order.lines.flatMap((line) => [
              String(line.menuItemId),
              ...(line.secondHalfItemId ? [line.secondHalfItemId] : []),
            ]),
          )
        );
      });
      if (!readyBids.length) {
        for (const offer of order.offers)
          if (offer.status === OfferStatus.PENDING)
            offer.status = OfferStatus.EXPIRED;
        await order.save();
        return this.afterNoPendingOffers(order);
      }

      const maxPrep = Math.max(
        ...readyBids.map((b) => b.quotedPrepMinutes ?? 1),
        1,
      );
      const maxRecent = Math.max(
        ...providerDocs.map((p) => p.recentAcceptCount ?? 0),
        1,
      );

      const ranked = readyBids
        .map((bid) => {
          const p = byId.get(String(bid.providerId))!;
          const prepScore = 1 - (bid.quotedPrepMinutes ?? maxPrep) / maxPrep;
          const fairness =
            (p.fairnessWeight ?? 1) *
            (1 - (p.recentAcceptCount ?? 0) / maxRecent);
          return {
            bid,
            score:
              0.35 * (bid.score ?? 0) +
              0.25 * prepScore +
              ((cfg.w5Quality ?? 0.25) * (p.qualityScore ?? 100)) / 100 +
              (cfg.w4Fairness ?? 0.15) * fairness,
          };
        })
        .sort((a, b) => b.score - a.score);
      let selected: (typeof ranked)[number] | undefined;
      for (const candidate of ranked) {
        if (
          !this.inventory ||
          (await this.inventory.reserve(
            String(candidate.bid.providerId),
            order.id,
            order.lines,
          ))
        ) {
          selected = candidate;
          break;
        }
        candidate.bid.status = OfferStatus.REJECTED;
      }
      if (!selected) {
        for (const offer of order.offers)
          if (offer.status === OfferStatus.PENDING)
            offer.status = OfferStatus.EXPIRED;
        await order.save();
        return this.afterNoPendingOffers(order);
      }
      const best = selected.bid,
        bestScore = selected.score,
        winnerId = String(best.providerId);

      best.status = OfferStatus.ACCEPTED;
      for (const other of order.offers) {
        if (
          String(other.providerId) !== winnerId &&
          other.status === OfferStatus.PENDING
        ) {
          other.status = OfferStatus.EXPIRED;
        }
      }
      order.providerId = new Types.ObjectId(winnerId);
      order.status = OrderStatus.ACCEPTED_BY_PROVIDER;
      order.acceptedAt = new Date();
      order.quotedPrepMinutes = best.quotedPrepMinutes;
      await this.eta.computeForOrder(order, {
        quotedPrepMinutes: best.quotedPrepMinutes,
        queueDepth: byId.get(winnerId)?.openOrders ?? 0,
      });
      await order.save();
      await this.providers.bumpOpenOrders(winnerId, 1);

      this.realtime.emitOrderStatus(
        order.id,
        String(order.customerId),
        order.status,
      );
      this.realtime.emitToProvider(winnerId, "order.status", {
        orderId: order.id,
        status: order.status,
        winner: true,
      });
      void this.push.notifyCustomerStatus(
        String(order.customerId),
        order.id,
        order.status,
      );

      return {
        orderId: order.id,
        status: order.status,
        providerId: winnerId,
        quotedPrepMinutes: best.quotedPrepMinutes,
        waveScore: bestScore,
        eta: {
          prepMin: order.etaPrepMin,
          prepMax: order.etaPrepMax,
          deliveryMin: order.etaDeliveryMin,
          deliveryMax: order.etaDeliveryMax,
        },
      };
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }

  /**
   * When bid window ends: expire unanswered, then resolve among ready bids.
   */
  async processExpiredOffers(now = new Date()) {
    const candidates = await this.orders
      .find({
        status: OrderStatus.PENDING_OFFERS,
        "offers.status": OfferStatus.PENDING,
        "offers.expiresAt": { $lte: now },
      })
      .exec();

    const results: Array<Record<string, unknown>> = [];
    for (const order of candidates) {
      const lockKey = `order:wave:${order.id}`;
      const owner = `expiry:${order.id}`;
      const acquired = await this.redis.acquireLock(lockKey, owner, 10_000);
      if (!acquired) continue;

      let shouldResolve = false;
      try {
        const fresh = await this.orders.findById(order.id).exec();
        if (!fresh || fresh.status !== OrderStatus.PENDING_OFFERS) continue;
        if (fresh.providerId) continue;

        for (const offer of fresh.offers) {
          if (
            offer.status === OfferStatus.PENDING &&
            !offer.respondedAt &&
            offer.expiresAt &&
            offer.expiresAt.getTime() <= now.getTime()
          ) {
            offer.status = OfferStatus.EXPIRED;
            offer.respondedAt = now;
            this.realtime.emitToProvider(
              String(offer.providerId),
              "offer.expired",
              {
                orderId: fresh.id,
                providerId: String(offer.providerId),
              },
            );
          }
        }
        await fresh.save();
        shouldResolve = true;
      } catch (err) {
        this.logger.error(
          `Wave expiry failed for ${order.id}: ${(err as Error).message}`,
        );
      } finally {
        await this.redis.releaseLock(lockKey, owner);
      }

      if (shouldResolve) {
        try {
          results.push(await this.resolveWave(order.id));
        } catch (err) {
          this.logger.error(
            `Wave resolve failed for ${order.id}: ${(err as Error).message}`,
          );
        }
      }
    }
    return results;
  }

  /** Expand wave N + radius once per exhaustion, then cancel. */
  async afterNoPendingOffers(order: OrderDocument) {
    const maxExpands = 2;
    if ((order.waveExpandCount ?? 0) < maxExpands) {
      order.waveExpandCount = (order.waveExpandCount ?? 0) + 1;
      order.radiusExpanded = true;
      await order.save();
      this.logger.log(
        `Expanding wave #${order.waveExpandCount} for order ${order.id}`,
      );
      return this.startDispatch(order.id);
    }
    order.status = OrderStatus.CANCELLED;
    await order.save();
    this.realtime.emitOrderStatus(
      order.id,
      String(order.customerId),
      order.status,
    );
    void this.push.notifyCustomerStatus(
      String(order.customerId),
      order.id,
      order.status,
    );
    return {
      orderId: order.id,
      status: order.status,
      reason: "offers_exhausted",
    };
  }

  @Cron("*/30 * * * * *")
  async releaseScheduledOrders() {
    const due = await this.orders
      .find({
        status: OrderStatus.SCHEDULED,
        scheduledAt: { $lte: new Date() },
        paymentStatus: {
          $in: [PaymentStatus.CAPTURED, PaymentStatus.AUTHORIZED],
        },
      })
      .limit(100)
      .exec();
    for (const order of due) {
      const owner = randomUUID();
      const key = `order:wave:${order.id}`;
      if (!(await this.redis.acquireLock(key, owner, 120_000))) continue;
      try {
        const fresh = await this.orders.findById(order.id).exec();
        if (fresh?.status === OrderStatus.SCHEDULED)
          await this.startDispatch(order.id);
      } catch (error) {
        this.logger.error(
          `Scheduled dispatch ${order.id}: ${(error as Error).message}`,
        );
      } finally {
        await this.redis.releaseLock(key, owner);
      }
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleOfferExpiryCron() {
    if (this.expiryRunning) return;
    this.expiryRunning = true;
    try {
      const results = await this.processExpiredOffers();
      if (results.length) {
        this.logger.log(`Processed ${results.length} wave-expiry order(s)`);
      }
    } catch (err) {
      this.logger.error(`Wave expiry cron failed: ${(err as Error).message}`);
    } finally {
      this.expiryRunning = false;
    }
  }

  async listOffersForProvider(providerId: string) {
    const orders = await this.orders
      .find({
        status: OrderStatus.PENDING_OFFERS,
        "offers.providerId": new Types.ObjectId(providerId),
        "offers.status": OfferStatus.PENDING,
      })
      .exec();

    return orders.map((o) => {
      const offer = o.offers.find((x) => String(x.providerId) === providerId);
      return {
        orderId: o.id,
        totalCents: o.totalCents,
        lines: o.lines,
        score: offer?.score,
        expiresAt: offer?.expiresAt,
        ready: offer?.ready,
        quotedPrepMinutes: offer?.quotedPrepMinutes,
        respondedAt: offer?.respondedAt,
        wave: true,
        deliveryLatitude: o.deliveryLatitude,
        deliveryLongitude: o.deliveryLongitude,
      };
    });
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

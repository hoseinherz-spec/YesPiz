import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron, CronExpression } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OfferStatus, OrderStatus } from "../common/enums";
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
  ) {}

  async startDispatch(orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (
      order.status !== OrderStatus.PENDING_PAYMENT &&
      order.status !== OrderStatus.PENDING_OFFERS
    ) {
      throw new BadRequestException("errors.badRequest");
    }

    const cfg = await this.config.get();
    const lng = order.deliveryLongitude!;
    const lat = order.deliveryLatitude!;
    const radius = order.radiusExpanded
      ? cfg.dispatchExpandedRadiusMeters
      : cfg.dispatchInitialRadiusMeters;

    const nearby = await this.providers.findNearby(lng, lat, radius);
    const ranked = this.rankProviders(
      nearby,
      lng,
      lat,
      cfg.w1Rating,
      cfg.w2Proximity,
      cfg.w3QueueEmptiness,
    );
    const top = ranked.slice(0, cfg.dispatchTopN);
    const expiresAt = new Date(
      Date.now() + (cfg.offerTimeoutSeconds ?? 90) * 1000,
    );

    order.offers = top.map((p) => ({
      providerId: p._id as Types.ObjectId,
      status: OfferStatus.PENDING,
      score: p._score,
      expiresAt,
    }));
    order.status = OrderStatus.PENDING_OFFERS;
    await order.save();

    this.logger.log(
      `Broadcast ${top.length} offers for order ${orderId} (expires ${expiresAt.toISOString()})`,
    );

    for (const offer of order.offers) {
      const providerId = String(offer.providerId);
      this.realtime.emitToProvider(providerId, "offer.created", {
        orderId: order.id,
        providerId,
        expiresAt: expiresAt.toISOString(),
        score: offer.score,
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
      expiresAt: expiresAt.toISOString(),
      offers: order.offers.map((o) => ({
        providerId: String(o.providerId),
        score: o.score,
        status: o.status,
        expiresAt: o.expiresAt?.toISOString(),
      })),
    };
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

  async acceptOffer(orderId: string, providerId: string) {
    const lockKey = `order:accept:${orderId}`;
    const owner = providerId;
    const acquired = await this.redis.acquireLock(lockKey, owner, 15_000);
    if (!acquired) {
      throw new ConflictException("errors.conflict");
    }

    try {
      const order = await this.orders.findById(orderId).exec();
      if (!order) throw new NotFoundException("errors.notFound");
      if (order.status !== OrderStatus.PENDING_OFFERS) {
        throw new ConflictException("errors.conflict");
      }
      if (order.providerId) {
        throw new ConflictException("errors.conflict");
      }

      const offer = order.offers.find(
        (o) => String(o.providerId) === providerId,
      );
      if (!offer || offer.status !== OfferStatus.PENDING) {
        throw new BadRequestException("errors.badRequest");
      }
      if (offer.expiresAt && offer.expiresAt.getTime() < Date.now()) {
        throw new BadRequestException("errors.badRequest");
      }

      offer.status = OfferStatus.ACCEPTED;
      offer.respondedAt = new Date();
      for (const other of order.offers) {
        if (
          String(other.providerId) !== providerId &&
          other.status === OfferStatus.PENDING
        ) {
          other.status = OfferStatus.EXPIRED;
        }
      }
      order.providerId = new Types.ObjectId(providerId);
      order.status = OrderStatus.ACCEPTED_BY_PROVIDER;
      await order.save();
      await this.providers.bumpOpenOrders(providerId, 1);

      this.realtime.emitOrderStatus(
        order.id,
        String(order.customerId),
        order.status,
      );
      this.realtime.emitToProvider(providerId, "order.status", {
        orderId: order.id,
        status: order.status,
      });
      void this.push.notifyCustomerStatus(
        String(order.customerId),
        order.id,
        order.status,
      );

      return {
        orderId: order.id,
        status: order.status,
        providerId,
      };
    } finally {
      await this.redis.releaseLock(lockKey, owner);
    }
  }

  async rejectOffer(orderId: string, providerId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (order.status !== OrderStatus.PENDING_OFFERS) {
      throw new BadRequestException("errors.badRequest");
    }

    const offer = order.offers.find((o) => String(o.providerId) === providerId);
    if (!offer || offer.status !== OfferStatus.PENDING) {
      throw new BadRequestException("errors.badRequest");
    }
    offer.status = OfferStatus.REJECTED;
    offer.respondedAt = new Date();
    await order.save();

    const pending = order.offers.filter(
      (o) => o.status === OfferStatus.PENDING,
    );
    if (pending.length === 0) {
      return this.afterNoPendingOffers(order);
    }

    return {
      orderId: order.id,
      status: order.status,
      remainingOffers: pending.length,
    };
  }

  /**
   * Expire timed-out offers, then expand radius once, else cancel.
   * Safe with first-accept lock: skips orders currently being accepted.
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
      const lockKey = `order:accept:${order.id}`;
      const owner = `expiry:${order.id}`;
      const acquired = await this.redis.acquireLock(lockKey, owner, 10_000);
      if (!acquired) continue;

      try {
        // Re-read under lock
        const fresh = await this.orders.findById(order.id).exec();
        if (!fresh || fresh.status !== OrderStatus.PENDING_OFFERS) continue;

        let expiredAny = false;
        for (const offer of fresh.offers) {
          if (
            offer.status === OfferStatus.PENDING &&
            offer.expiresAt &&
            offer.expiresAt.getTime() <= now.getTime()
          ) {
            offer.status = OfferStatus.EXPIRED;
            offer.respondedAt = now;
            expiredAny = true;
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
        if (!expiredAny) continue;
        await fresh.save();

        const pending = fresh.offers.filter(
          (o) => o.status === OfferStatus.PENDING,
        );
        if (pending.length === 0) {
          results.push(await this.afterNoPendingOffers(fresh));
        } else {
          results.push({
            orderId: fresh.id,
            status: fresh.status,
            remainingOffers: pending.length,
            expired: true,
          });
        }
      } finally {
        await this.redis.releaseLock(lockKey, owner);
      }
    }
    return results;
  }

  /** Public for tests — expand once then cancel. */
  async afterNoPendingOffers(order: OrderDocument) {
    if (!order.radiusExpanded) {
      order.radiusExpanded = true;
      await order.save();
      this.logger.log(`Expanding radius for order ${order.id}`);
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

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleOfferExpiryCron() {
    if (this.expiryRunning) return;
    this.expiryRunning = true;
    try {
      const results = await this.processExpiredOffers();
      if (results.length) {
        this.logger.log(`Processed ${results.length} expired-offer order(s)`);
      }
    } catch (err) {
      this.logger.error(`Offer expiry cron failed: ${(err as Error).message}`);
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

    return orders.map((o) => ({
      orderId: o.id,
      totalCents: o.totalCents,
      lines: o.lines,
      score: o.offers.find((x) => String(x.providerId) === providerId)?.score,
      expiresAt: o.offers.find((x) => String(x.providerId) === providerId)
        ?.expiresAt,
      deliveryLatitude: o.deliveryLatitude,
      deliveryLongitude: o.deliveryLongitude,
    }));
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

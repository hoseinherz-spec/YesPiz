import { ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OfferStatus, OrderStatus } from "../common/enums";
import { EtaService } from "../eta/eta.service";
import { Order } from "../orders/schemas/order.schema";
import { ProvidersService } from "../providers/providers.service";
import { ProviderDocument } from "../providers/schemas/provider.schema";
import { PushService } from "../push/push.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { RedisService } from "../redis/redis.service";
import { DispatchService } from "./dispatch.service";

describe("DispatchService", () => {
  let service: DispatchService;
  let redis: RedisService;
  let findOrderById: jest.Mock;
  let findOrders: jest.Mock;
  let bumpOpenOrders: jest.Mock;
  let findNearby: jest.Mock;
  let getById: jest.Mock;

  const cfg = {
    w1Rating: 0.4,
    w2Proximity: 0.4,
    w3QueueEmptiness: 0.2,
    w4Fairness: 0.15,
    w5Quality: 0.25,
    dispatchTopN: 5,
    waveSize: 3,
    bidWindowSeconds: 15,
    dispatchInitialRadiusMeters: 3000,
    dispatchExpandedRadiusMeters: 5000,
    offerTimeoutSeconds: 90,
    etaBasePrepMinutes: 18,
    etaBaseDeliveryMinutes: 22,
    etaWindowPaddingMinutes: 5,
  };

  beforeEach(async () => {
    findOrderById = jest.fn();
    findOrders = jest.fn();
    bumpOpenOrders = jest.fn().mockResolvedValue(undefined);
    findNearby = jest.fn().mockResolvedValue([]);
    getById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DispatchService,
        RedisService,
        {
          provide: ConfigService,
          useValue: { get: () => undefined },
        },
        {
          provide: getModelToken(Order.name),
          useValue: { findById: findOrderById, find: findOrders },
        },
        {
          provide: ProvidersService,
          useValue: {
            findNearby,
            bumpOpenOrders,
            getById,
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn().mockResolvedValue(cfg),
          },
        },
        {
          provide: EtaService,
          useValue: {
            computeForOrder: jest.fn().mockImplementation(async (order) => {
              order.etaPrepMin = 15;
              order.etaPrepMax = 25;
              order.etaDeliveryMin = 18;
              order.etaDeliveryMax = 28;
              order.etaComputedAt = new Date();
            }),
          },
        },
        {
          provide: RealtimeGateway,
          useValue: {
            emitToProvider: jest.fn(),
            emitOrderStatus: jest.fn(),
            emitToOrder: jest.fn(),
            emitToUser: jest.fn(),
          },
        },
        {
          provide: PushService,
          useValue: {
            notifyProviderOffer: jest.fn().mockResolvedValue({ ok: true }),
            notifyCustomerStatus: jest.fn().mockResolvedValue({ ok: true }),
          },
        },
      ],
    }).compile();

    service = module.get(DispatchService);
    redis = module.get(RedisService);
  });

  it("holds a scheduled order without contacting kitchens", async () => {
    const order = {
      id: new Types.ObjectId().toString(),
      status: OrderStatus.PENDING_PAYMENT,
      scheduledAt: new Date(Date.now() + 3600000),
      save: jest.fn().mockResolvedValue(undefined),
    };
    findOrderById.mockReturnValue({ exec: async () => order });
    expect(await service.startDispatch(order.id)).toMatchObject({
      status: OrderStatus.SCHEDULED,
      offerCount: 0,
    });
    expect(order.status).toBe(OrderStatus.SCHEDULED);
    expect(findNearby).not.toHaveBeenCalled();
  });
  it("releases due schedules once and does not revive cancelled orders", async () => {
    const order = {
      id: new Types.ObjectId().toString(),
      customerId: new Types.ObjectId(),
      status: OrderStatus.SCHEDULED,
      scheduledAt: new Date(Date.now() - 1000),
      lines: [],
      offers: [],
      save: jest.fn().mockResolvedValue(undefined),
    };
    findOrders.mockReturnValue({
      limit: () => ({ exec: async () => [order] }),
    });
    findOrderById.mockReturnValue({ exec: async () => order });
    await service.releaseScheduledOrders();
    expect(findNearby).toHaveBeenCalledTimes(1);
    expect(order.status).toBe(OrderStatus.ADMIN_REVIEW); // No kitchens: surface to operations, never silently drop payment.
    await service.releaseScheduledOrders();
    expect(findNearby).toHaveBeenCalledTimes(1);
    order.status = OrderStatus.CANCELLED;
    await service.releaseScheduledOrders();
    expect(findNearby).toHaveBeenCalledTimes(1);
  });

  describe("rankProviders", () => {
    it("scores w1·rating + w2·proximity + w3·queueEmptiness and sorts desc", () => {
      const lng = 11.5755;
      const lat = 48.1374;
      const providers = [
        {
          _id: new Types.ObjectId(),
          rating: 5,
          latitude: lat,
          longitude: lng,
          openOrders: 0,
        },
        {
          _id: new Types.ObjectId(),
          rating: 3,
          latitude: lat + 0.02,
          longitude: lng,
          openOrders: 4,
        },
      ] as unknown as ProviderDocument[];

      const ranked = service.rankProviders(providers, lng, lat, 0.4, 0.4, 0.2);

      expect(ranked).toHaveLength(2);
      expect(ranked[0]!._score).toBeGreaterThan(ranked[1]!._score);
      expect(ranked[0]!._score).toBeCloseTo(1, 5);
      expect(ranked[0]!.rating).toBe(5);
    });
  });

  describe("wave respond + resolve", () => {
    it("does not assign on first ready bid when others still pending", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const providerA = new Types.ObjectId().toHexString();
      const providerB = new Types.ObjectId().toHexString();

      const order = {
        id: orderId,
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        providerId: undefined as Types.ObjectId | undefined,
        offers: [
          {
            providerId: new Types.ObjectId(providerA),
            status: OfferStatus.PENDING,
            score: 0.9,
            expiresAt: new Date(Date.now() + 60_000),
          },
          {
            providerId: new Types.ObjectId(providerB),
            status: OfferStatus.PENDING,
            score: 0.8,
            expiresAt: new Date(Date.now() + 60_000),
          },
        ],
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrderById.mockReturnValue({
        exec: () => Promise.resolve(order),
      });

      const first = await service.respondToWave(orderId, providerA, true, 18);
      expect(first).toMatchObject({
        orderId,
        awaitingResponses: 1,
        ready: true,
      });
      expect(order.providerId).toBeUndefined();
      expect(bumpOpenOrders).not.toHaveBeenCalled();
    });

    it("resolves wave when all kitchens have responded — server picks winner", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const providerA = new Types.ObjectId().toHexString();
      const providerB = new Types.ObjectId().toHexString();

      const order = {
        id: orderId,
        customerId: new Types.ObjectId(),
        lines: [{ menuItemId: new Types.ObjectId() }],
        status: OrderStatus.PENDING_OFFERS,
        providerId: undefined as Types.ObjectId | undefined,
        offers: [
          {
            providerId: new Types.ObjectId(providerA),
            status: OfferStatus.PENDING,
            score: 0.7,
            expiresAt: new Date(Date.now() + 60_000),
            ready: true,
            quotedPrepMinutes: 25,
            respondedAt: new Date(),
          },
          {
            providerId: new Types.ObjectId(providerB),
            status: OfferStatus.PENDING,
            score: 0.6,
            expiresAt: new Date(Date.now() + 60_000),
          },
        ],
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrderById.mockReturnValue({
        exec: () => Promise.resolve(order),
      });
      getById.mockImplementation(async (id: string) => ({
        id,
        qualityScore: id === providerB ? 95 : 70,
        recentAcceptCount: id === providerA ? 5 : 0,
        fairnessWeight: 1,
        openOrders: 0,
      }));

      const result = await service.respondToWave(orderId, providerB, true, 12);
      expect(result).toMatchObject({
        orderId,
        status: OrderStatus.ACCEPTED_BY_PROVIDER,
      });
      expect(order.providerId).toBeDefined();
      expect(bumpOpenOrders).toHaveBeenCalled();
    });

    it("resolveWave lock conflicts when another resolve is in progress", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const lockKey = `order:wave:${orderId}`;
      await redis.acquireLock(lockKey, "other-owner", 15_000);

      await expect(service.resolveWave(orderId)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe("expire → expand → cancel", () => {
    it("expands wave when bid window ends with no ready bids", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const providerId = new Types.ObjectId();
      const now = new Date();

      const order = {
        id: orderId,
        _id: new Types.ObjectId(orderId),
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        radiusExpanded: false,
        waveExpandCount: 0,
        deliveryLongitude: 11.57,
        deliveryLatitude: 48.13,
        lines: [] as Array<{ menuItemId: Types.ObjectId }>,
        offers: [
          {
            providerId,
            status: OfferStatus.PENDING,
            expiresAt: new Date(now.getTime() - 1000),
            score: 0.9,
          },
        ],
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrders.mockReturnValue({
        exec: () => Promise.resolve([order]),
      });
      findOrderById.mockReturnValue({
        exec: () => Promise.resolve(order),
      });

      const nearbyProvider = {
        _id: new Types.ObjectId(),
        rating: 4,
        latitude: 48.13,
        longitude: 11.57,
        openOrders: 0,
      };
      findNearby.mockResolvedValue([nearbyProvider]);

      const results = await service.processExpiredOffers(now);
      expect(order.waveExpandCount).toBeGreaterThanOrEqual(1);
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(order.status).toBe(OrderStatus.PENDING_OFFERS);
    });

    it("cancels order when waves exhausted", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const order = {
        id: orderId,
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        radiusExpanded: true,
        waveExpandCount: 2,
        offers: [] as Array<{ status: OfferStatus }>,
        save: jest.fn().mockResolvedValue(undefined),
      };

      const cancelled = await service.afterNoPendingOffers(order as never);
      expect(cancelled).toEqual({
        orderId,
        status: OrderStatus.CANCELLED,
        reason: "offers_exhausted",
      });
    });

    it("sends an empty dispatch wave to admin review", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const order = {
        id: orderId,
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        radiusExpanded: false,
        waveExpandCount: 0,
        deliveryLongitude: 11.57,
        deliveryLatitude: 48.13,
        lines: [] as Array<{ menuItemId: Types.ObjectId }>,
        offers: [] as Array<{ status: OfferStatus }>,
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
      findNearby.mockResolvedValue([]);

      await service.afterNoPendingOffers(order as never);
      expect(order.waveExpandCount).toBe(1);

      expect(order.status).toBe(OrderStatus.ADMIN_REVIEW);
      expect(order.offers).toHaveLength(0);
    });
  });
});

import { ConflictException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OfferStatus, OrderStatus } from "../common/enums";
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

  beforeEach(async () => {
    findOrderById = jest.fn();
    findOrders = jest.fn();
    bumpOpenOrders = jest.fn().mockResolvedValue(undefined);
    findNearby = jest.fn().mockResolvedValue([]);

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
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn().mockResolvedValue({
              w1Rating: 0.4,
              w2Proximity: 0.4,
              w3QueueEmptiness: 0.2,
              dispatchTopN: 5,
              dispatchInitialRadiusMeters: 3000,
              dispatchExpandedRadiusMeters: 5000,
              offerTimeoutSeconds: 90,
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
      expect(ranked[0]._score).toBeGreaterThan(ranked[1]._score);
      expect(ranked[0]._score).toBeCloseTo(1, 5);
      expect(ranked[0].rating).toBe(5);
    });
  });

  describe("acceptOffer first-accept-wins", () => {
    it("acquires Redis lock; second concurrent accept conflicts", async () => {
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
            expiresAt: new Date(Date.now() + 60_000),
          },
          {
            providerId: new Types.ObjectId(providerB),
            status: OfferStatus.PENDING,
            expiresAt: new Date(Date.now() + 60_000),
          },
        ],
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrderById.mockReturnValue({
        exec: () => Promise.resolve(order),
      });

      const first = await service.acceptOffer(orderId, providerA);
      expect(first.providerId).toBe(providerA);
      expect(order.status).toBe(OrderStatus.ACCEPTED_BY_PROVIDER);
      expect(bumpOpenOrders).toHaveBeenCalledWith(providerA, 1);

      const lockKey = `order:accept:${orderId}`;
      await redis.acquireLock(lockKey, "other-owner", 15_000);

      await expect(
        service.acceptOffer(orderId, providerB),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe("expire → expand → cancel", () => {
    it("expands radius once when all offers expire", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const providerId = new Types.ObjectId();
      const now = new Date();

      const order = {
        id: orderId,
        _id: new Types.ObjectId(orderId),
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        radiusExpanded: false,
        deliveryLongitude: 11.57,
        deliveryLatitude: 48.13,
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

      // Second call inside startDispatch after expand
      const nearbyProvider = {
        _id: new Types.ObjectId(),
        rating: 4,
        latitude: 48.13,
        longitude: 11.57,
        openOrders: 0,
      };
      findNearby.mockResolvedValue([nearbyProvider]);

      const results = await service.processExpiredOffers(now);
      expect(order.radiusExpanded).toBe(true);
      expect(results.length).toBeGreaterThanOrEqual(1);
      // After expand, startDispatch runs and creates new offers
      expect(order.status).toBe(OrderStatus.PENDING_OFFERS);
      expect(order.offers.some((o) => o.status === OfferStatus.PENDING)).toBe(
        true,
      );
    });

    it("cancels order when offers expire after radius already expanded", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const now = new Date();
      const order = {
        id: orderId,
        _id: new Types.ObjectId(orderId),
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        radiusExpanded: true,
        offers: [
          {
            providerId: new Types.ObjectId(),
            status: OfferStatus.PENDING,
            expiresAt: new Date(now.getTime() - 500),
          },
        ],
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrders.mockReturnValue({ exec: () => Promise.resolve([order]) });
      findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });

      const results = await service.processExpiredOffers(now);
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(results[0]).toMatchObject({
        orderId,
        status: OrderStatus.CANCELLED,
        reason: "offers_exhausted",
      });
    });

    it("afterNoPendingOffers expands then cancels on second exhaustion", async () => {
      const orderId = new Types.ObjectId().toHexString();
      const order = {
        id: orderId,
        customerId: new Types.ObjectId(),
        status: OrderStatus.PENDING_OFFERS,
        radiusExpanded: false,
        deliveryLongitude: 11.57,
        deliveryLatitude: 48.13,
        offers: [] as Array<{ status: OfferStatus }>,
        save: jest.fn().mockResolvedValue(undefined),
      };

      findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
      findNearby.mockResolvedValue([]);

      const expanded = await service.afterNoPendingOffers(order as never);
      expect(order.radiusExpanded).toBe(true);
      expect(expanded).toMatchObject({ orderId, offerCount: 0 });

      // Simulate second exhaustion after expand
      order.offers = [];
      const cancelled = await service.afterNoPendingOffers(order as never);
      expect(cancelled).toEqual({
        orderId,
        status: OrderStatus.CANCELLED,
        reason: "offers_exhausted",
      });
    });
  });
});

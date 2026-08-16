import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { NotFoundException } from "@nestjs/common";
import { CatalogService } from "../catalog/catalog.service";
import { AccountService } from "../account/account.service";
import { AppConfigService } from "../app-config/app-config.service";
import { EtaService } from "../eta/eta.service";
import { ProvidersService } from "../providers/providers.service";
import { PushService } from "../push/push.service";
import { QualityService } from "../quality/quality.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { Order } from "./schemas/order.schema";
import { DeliveryAddress } from "./schemas/address.schema";
import { CourierSession } from "../couriers/schemas/courier.schema";
import { Incident } from "../incidents/schemas/incident.schema";
import { OrdersService } from "./orders.service";

describe("OrdersService reorder", () => {
  let service: OrdersService;
  let findOrderById: jest.Mock;

  const userId = "507f1f77bcf86cd799439011";
  const orderId = "507f1f77bcf86cd799439012";

  beforeEach(async () => {
    findOrderById = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: { findById: findOrderById, find: jest.fn() },
        },
        {
          provide: getModelToken(DeliveryAddress.name),
          useValue: {},
        },
        {
          provide: getModelToken(CourierSession.name),
          useValue: {},
        },
        {
          provide: getModelToken(Incident.name),
          useValue: { find: jest.fn() },
        },
        {
          provide: CatalogService,
          useValue: {
            getPublishedMenu: jest.fn().mockResolvedValue({
              version: { version: 2 },
              items: [{ id: "item-new", name: "Margherita", priceCents: 900 }],
            }),
            getActiveItemsByIds: jest.fn().mockResolvedValue({ items: [] }),
          },
        },
        { provide: AccountService, useValue: {} },
        { provide: RealtimeGateway, useValue: {} },
        { provide: PushService, useValue: {} },
        { provide: AppConfigService, useValue: { get: jest.fn() } },
        { provide: QualityService, useValue: {} },
        { provide: EtaService, useValue: {} },
        { provide: ProvidersService, useValue: {} },
      ],
    }).compile();

    service = module.get(OrdersService);
  });

  it("marks items unavailable when not on published menu", async () => {
    findOrderById.mockReturnValue({
      exec: () =>
        Promise.resolve({
          id: orderId,
          customerId: userId,
          deliveryFeeCents: 299,
          lines: [
            {
              menuItemId: "old-item-id",
              name: "Removed Pizza",
              unitPriceCents: 800,
              quantity: 2,
            },
          ],
        }),
    });

    const preview = await service.buildReorderPreview(userId, orderId);
    expect(preview.unavailable).toHaveLength(1);
    expect(preview.unavailable[0]).toMatchObject({
      name: "Removed Pizza",
      reason: "not_on_menu",
      quantity: 2,
    });
    expect(preview.cartLines).toHaveLength(0);
  });

  it("rejects reorder for another customer", async () => {
    findOrderById.mockReturnValue({
      exec: () =>
        Promise.resolve({
          id: orderId,
          customerId: "other-user",
          lines: [],
          deliveryFeeCents: 299,
        }),
    });

    await expect(
      service.buildReorderPreview(userId, orderId),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

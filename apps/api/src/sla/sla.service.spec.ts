import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { OrderStatus } from "../common/enums";
import { Order } from "../orders/schemas/order.schema";
import { User } from "../account/schemas/user.schema";
import { AppConfigService } from "../app-config/app-config.service";
import { SlaService } from "./sla.service";

describe("SlaService", () => {
  let service: SlaService;
  let findOrderById: jest.Mock;
  let findOneAndUpdate: jest.Mock;
  let updateUser: jest.Mock;

  const orderId = "507f1f77bcf86cd799439011";
  const customerId = "507f1f77bcf86cd799439012";

  beforeEach(async () => {
    findOrderById = jest.fn();
    findOneAndUpdate = jest.fn();
    updateUser = jest.fn().mockReturnValue({ exec: () => Promise.resolve({}) });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlaService,
        {
          provide: getModelToken(Order.name),
          useValue: {
            findById: findOrderById,
            findOneAndUpdate,
            find: jest.fn().mockReturnValue({
              sort: () => ({
                limit: () => ({
                  select: () => ({
                    exec: () => Promise.resolve([]),
                  }),
                }),
              }),
            }),
          },
        },
        {
          provide: getModelToken(User.name),
          useValue: { findByIdAndUpdate: updateUser },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn().mockResolvedValue({ slaCompensationCents: 500 }),
          },
        },
      ],
    }).compile();

    service = module.get(SlaService);
  });

  it("grants credit once when delivery missed ETA max", async () => {
    const etaComputedAt = new Date("2026-01-01T12:00:00.000Z");
    const completedAt = new Date("2026-01-01T13:00:00.000Z");

    findOrderById.mockReturnValue({
      exec: () =>
        Promise.resolve({
          _id: orderId,
          id: orderId,
          customerId,
          status: OrderStatus.COMPLETED,
          etaDeliveryMax: 30,
          etaComputedAt,
          completedAt,
          compensatedAt: undefined,
        }),
    });

    findOneAndUpdate.mockReturnValue({
      exec: () =>
        Promise.resolve({
          id: orderId,
          compensationCents: 500,
          compensatedAt: new Date(),
        }),
    });

    const first = await service.evaluateOrder(orderId);
    expect(first.compensated).toBe(true);
    expect(first.compensationCents).toBe(500);
    expect(updateUser).toHaveBeenCalledWith(customerId, { $inc: { creditCents: 500 } });
  });

  it("is idempotent when compensatedAt already set", async () => {
    findOrderById.mockReturnValue({
      exec: () =>
        Promise.resolve({
          _id: orderId,
          id: orderId,
          customerId,
          status: OrderStatus.COMPLETED,
          etaDeliveryMax: 30,
          etaComputedAt: new Date("2026-01-01T12:00:00.000Z"),
          completedAt: new Date("2026-01-01T13:00:00.000Z"),
          compensatedAt: new Date("2026-01-01T13:05:00.000Z"),
          compensationCents: 500,
        }),
    });

    const result = await service.evaluateOrder(orderId);
    expect(result.compensated).toBe(false);
    expect(result.reason).toBe("already_compensated");
    expect(findOneAndUpdate).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });
});

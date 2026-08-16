import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { Order } from "../orders/schemas/order.schema";
import { EtaService } from "./eta.service";

describe("EtaService", () => {
  let service: EtaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EtaService,
        {
          provide: getModelToken(Order.name),
          useValue: {
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
          provide: AppConfigService,
          useValue: {
            get: jest.fn().mockResolvedValue({
              etaBasePrepMinutes: 18,
              etaBaseDeliveryMinutes: 22,
              etaWindowPaddingMinutes: 5,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(EtaService);
  });

  it("returns a prep + delivery range from quoted prep", async () => {
    const order = {
      lines: [{ cookTimeSeconds: 600, quantity: 1 }],
      providerId: new Types.ObjectId(),
    } as never;

    const window = await service.computeForOrder(order, {
      quotedPrepMinutes: 20,
      queueDepth: 1,
    });

    expect(window.etaPrepMin).toBeLessThan(window.etaPrepMax);
    expect(window.etaDeliveryMin).toBeLessThan(window.etaDeliveryMax);
    expect(window.etaPrepMin).toBeGreaterThanOrEqual(5);
  });
});

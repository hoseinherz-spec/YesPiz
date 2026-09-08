import { MediaService } from "../media/media.module";
import { BadRequestException } from "@nestjs/common";
import { getModelToken } from "@nestjs/mongoose";
import { Test, TestingModule } from "@nestjs/testing";
import { AppConfigService } from "../app-config/app-config.service";
import { CatalogService } from "../catalog/catalog.service";
import { OrderStatus } from "../common/enums";
import { Order } from "../orders/schemas/order.schema";
import { ProvidersService } from "../providers/providers.service";
import { QualityService } from "./quality.service";

describe("QualityService", () => {
  let service: QualityService;
  let applyQualityPenalty: jest.Mock;
  let getItemsByIds: jest.Mock;

  beforeEach(async () => {
    applyQualityPenalty = jest.fn();
    getItemsByIds = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QualityService,
        { provide: MediaService, useValue: { assertReference: jest.fn() } },
        {
          provide: getModelToken(Order.name),
          useValue: { findById: jest.fn(), create: jest.fn() },
        },
        {
          provide: CatalogService,
          useValue: {
            getItemsByIds,
            getActiveItemsByIds: jest.fn(),
          },
        },
        {
          provide: ProvidersService,
          useValue: {
            getById: jest.fn(),
            applyQualityPenalty,
            unsuspend: jest.fn(),
            bumpOpenOrders: jest.fn(),
          },
        },
        {
          provide: AppConfigService,
          useValue: {
            get: jest.fn().mockResolvedValue({
              qualityAutoSuspendThreshold: 40,
            }),
          },
        },
      ],
    }).compile();

    service = module.get(QualityService);
  });

  it("blocks handoff without checklist", async () => {
    const order = {
      checklistCompletedAt: undefined,
      sealId: "S-1",
      lines: [{ menuItemId: "item1" }],
      menuVersion: 1,
    };

    await expect(
      service.assertHandoffReady(order as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("blocks handoff without seal when required", async () => {
    getItemsByIds.mockResolvedValue({
      items: [{ requiresNumberedSeal: true, requiresReadyPhoto: false }],
    });

    const order = {
      checklistCompletedAt: new Date(),
      sealId: undefined,
      lines: [{ menuItemId: "item1" }],
      menuVersion: 1,
      status: OrderStatus.PREPARING,
    };

    await expect(
      service.assertHandoffReady(order as never),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("allows handoff when checklist and seal are present", async () => {
    getItemsByIds.mockResolvedValue({
      items: [{ requiresNumberedSeal: true, requiresReadyPhoto: false }],
    });

    const order = {
      checklistCompletedAt: new Date(),
      sealId: "SEAL-42",
      lines: [{ menuItemId: "item1" }],
      menuVersion: 1,
    };

    await expect(
      service.assertHandoffReady(order as never),
    ).resolves.toBeUndefined();
  });

  it("applies quality penalty via providers", async () => {
    applyQualityPenalty.mockResolvedValue({
      qualityScore: 85,
      autoSuspended: false,
    });

    await service.recordIncident("provider1", "complaint");
    expect(applyQualityPenalty).toHaveBeenCalledWith(
      "provider1",
      "complaint",
      40,
    );
  });
});

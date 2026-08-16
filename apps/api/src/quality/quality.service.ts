import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { CatalogService } from "../catalog/catalog.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { ProvidersService } from "../providers/providers.service";
import {
  CreateTestOrderDto,
  SubmitChecklistDto,
  SubmitReadyPhotoDto,
  SubmitSealDto,
} from "./dto/quality.dto";

@Injectable()
export class QualityService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly catalog: CatalogService,
    private readonly providers: ProvidersService,
    private readonly appConfig: AppConfigService,
  ) {}

  async getProviderQuality(providerId: string) {
    const provider = await this.providers.getById(providerId);
    return {
      id: provider.id,
      qualityScore: provider.qualityScore,
      complaintCount: provider.complaintCount,
      delayCount: provider.delayCount,
      errorCount: provider.errorCount,
      autoSuspended: provider.autoSuspended,
      suspendedAt: provider.suspendedAt,
      suspendReason: provider.suspendReason,
      acceptingOrders: provider.acceptingOrders,
      rating: provider.rating,
    };
  }

  async submitChecklist(
    providerId: string,
    orderId: string,
    dto: SubmitChecklistDto,
  ) {
    const order = await this.requireProviderOrder(providerId, orderId);
    if (
      order.status !== OrderStatus.ACCEPTED_BY_PROVIDER &&
      order.status !== OrderStatus.PREPARING
    ) {
      throw new BadRequestException("errors.badRequest");
    }
    if (dto.answers.some((a) => !a.ok)) {
      throw new BadRequestException("errors.badRequest");
    }
    order.checklistAnswers = dto.answers;
    order.checklistCompletedAt = new Date();
    await order.save();
    return this.toKitchenQualityView(order);
  }

  async submitSeal(providerId: string, orderId: string, dto: SubmitSealDto) {
    const order = await this.requireProviderOrder(providerId, orderId);
    const sealId = dto.sealId.trim();
    if (!sealId) throw new BadRequestException("errors.badRequest");
    order.sealId = sealId;
    await order.save();
    return this.toKitchenQualityView(order);
  }

  async submitReadyPhoto(
    providerId: string,
    orderId: string,
    dto: SubmitReadyPhotoDto,
  ) {
    const order = await this.requireProviderOrder(providerId, orderId);
    const photoUrl = dto.photoUrl.trim();
    if (!photoUrl) throw new BadRequestException("errors.badRequest");
    order.readyPhotoUrl = photoUrl;
    await order.save();
    return this.toKitchenQualityView(order);
  }

  async recordIncident(
    providerId: string,
    kind: "complaint" | "delay" | "error",
  ) {
    const cfg = await this.appConfig.get();
    return this.providers.applyQualityPenalty(
      providerId,
      kind,
      cfg.qualityAutoSuspendThreshold,
    );
  }

  async unsuspend(providerId: string, reason?: string) {
    return this.providers.unsuspend(providerId, reason);
  }

  /**
   * Admin test order: skip payment, assign kitchen directly.
   * Customer still sees a blind view if they open it.
   */
  async createTestOrder(dto: CreateTestOrderDto) {
    await this.providers.getById(dto.providerId);

    const itemIds = dto.lines.map((l) => l.menuItemId);
    const { items } = await this.catalog.getActiveItemsByIds(
      itemIds,
      dto.menuVersion,
    );
    if (items.length !== new Set(itemIds).size) {
      throw new BadRequestException("errors.badRequest");
    }

    const byId = new Map(items.map((i) => [i.id, i]));
    let subtotalCents = 0;
    const lines = dto.lines.map((line) => {
      const item = byId.get(line.menuItemId)!;
      subtotalCents += item.priceCents * line.quantity;
      return {
        menuItemId: item._id,
        name: item.name,
        unitPriceCents: item.priceCents,
        quantity: line.quantity,
        prepWeight: item.prepWeight,
      };
    });

    const deliveryFeeCents = 0;
    const order = await this.orders.create({
      customerId: new Types.ObjectId(dto.customerId),
      menuVersion: dto.menuVersion,
      lines,
      subtotalCents,
      deliveryFeeCents,
      totalCents: subtotalCents + deliveryFeeCents,
      status: OrderStatus.ACCEPTED_BY_PROVIDER,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.CAPTURED,
      addressId: new Types.ObjectId(dto.addressId),
      providerId: new Types.ObjectId(dto.providerId),
      notes: dto.notes ?? "admin-test-order",
      isTestOrder: true,
    });

    await this.providers.bumpOpenOrders(dto.providerId, 1);
    return order;
  }

  async assertHandoffReady(order: OrderDocument) {
    if (!order.checklistCompletedAt) {
      throw new BadRequestException("errors.badRequest");
    }

    const itemIds = order.lines.map((l) => String(l.menuItemId));
    const { items } = await this.catalog.getItemsByIds(
      itemIds,
      order.menuVersion,
    );

    const requiresSeal =
      items.length === 0 || items.some((i) => i.requiresNumberedSeal !== false);
    const requiresPhoto = items.some((i) => i.requiresReadyPhoto === true);

    if (requiresSeal && !order.sealId) {
      throw new BadRequestException("errors.badRequest");
    }
    if (requiresPhoto && !order.readyPhotoUrl) {
      throw new BadRequestException("errors.badRequest");
    }
  }

  private async requireProviderOrder(providerId: string, orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (!order.providerId || String(order.providerId) !== providerId) {
      throw new ForbiddenException("errors.forbidden");
    }
    return order;
  }

  private toKitchenQualityView(order: OrderDocument) {
    return {
      id: order.id,
      status: order.status,
      sealId: order.sealId ?? null,
      checklistCompletedAt: order.checklistCompletedAt ?? null,
      checklistAnswers: order.checklistAnswers ?? [],
      readyPhotoUrl: order.readyPhotoUrl ?? null,
      isTestOrder: order.isTestOrder,
    };
  }
}

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AccountService } from "../account/account.service";
import { AppConfigService } from "../app-config/app-config.service";
import { CatalogService } from "../catalog/catalog.service";
import { Incident, IncidentDocument } from "../incidents/schemas/incident.schema";
import {
  IncidentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from "../common/enums";
import {
  CourierSession,
  CourierSessionDocument,
} from "../couriers/schemas/courier.schema";
import { EtaService } from "../eta/eta.service";
import { ProvidersService } from "../providers/providers.service";
import { PushService } from "../push/push.service";
import { QualityService } from "../quality/quality.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  CreateAddressDto,
  CreateOrderDto,
  ResolveAdminReviewDto,
  UpdateKitchenStatusDto,
} from "./dto/order.dto";
import { PrepOverrideDto } from "../providers/dto/provider.dto";
import { toCustomerView } from "./orders.sanitizer";
import { DeliveryAddress, AddressDocument } from "./schemas/address.schema";
import { Order, OrderDocument } from "./schemas/order.schema";

const KITCHEN_TRANSITIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  [OrderStatus.ACCEPTED_BY_PROVIDER]: [
    OrderStatus.PREPARING,
    OrderStatus.EXCEPTION_REPORTED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY_FOR_PICKUP,
    OrderStatus.EXCEPTION_REPORTED,
  ],
};

const ADMIN_RESOLVE_STATUSES = new Set<OrderStatus>([
  OrderStatus.ADMIN_REVIEW,
  OrderStatus.PREPARING,
  OrderStatus.CANCELLED,
]);

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(DeliveryAddress.name)
    private readonly addresses: Model<AddressDocument>,
    @InjectModel(CourierSession.name)
    private readonly courierSessions: Model<CourierSessionDocument>,
    @InjectModel(Incident.name)
    private readonly incidents: Model<IncidentDocument>,
    private readonly catalog: CatalogService,
    private readonly accounts: AccountService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
    private readonly appConfig: AppConfigService,
    private readonly quality: QualityService,
    private readonly eta: EtaService,
    private readonly providersService: ProvidersService,
  ) {}

  async createAddress(userId: string, dto: CreateAddressDto) {
    if (dto.isDefault) {
      await this.addresses
        .updateMany(
          { userId: new Types.ObjectId(userId) },
          { isDefault: false },
        )
        .exec();
    }
    return this.addresses.create({
      userId: new Types.ObjectId(userId),
      label: dto.label,
      street: dto.street,
      city: dto.city,
      zipcode: dto.zipcode,
      country: dto.country,
      longitude: dto.longitude,
      latitude: dto.latitude,
      location: {
        type: "Point",
        coordinates: [dto.longitude, dto.latitude],
      },
      isDefault: dto.isDefault ?? false,
      entrance: dto.entrance,
      floor: dto.floor,
      unit: dto.unit,
      doorCode: dto.doorCode,
      instructions: dto.instructions,
    });
  }

  listAddresses(userId: string) {
    return this.addresses.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async deleteAddress(userId: string, addressId: string) {
    const result = await this.addresses
      .deleteOne({
        _id: new Types.ObjectId(addressId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!result.deletedCount) {
      throw new NotFoundException("errors.notFound");
    }
    return { deleted: true };
  }

  async createOrder(userId: string, dto: CreateOrderDto) {
    const user = await this.accounts.findById(userId);
    if (!user) throw new ForbiddenException("errors.forbidden");

    if (dto.paymentMethod === PaymentMethod.CASH && user.cashBanned) {
      throw new BadRequestException("errors.badRequest");
    }

    const address = await this.addresses
      .findOne({
        _id: new Types.ObjectId(dto.addressId),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!address) throw new NotFoundException("errors.notFound");

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
      const unitPriceCents = item.priceCents;
      subtotalCents += unitPriceCents * line.quantity;
      return {
        menuItemId: item._id,
        name: item.name,
        unitPriceCents,
        quantity: line.quantity,
        prepWeight: item.prepWeight,
        cookTimeSeconds: item.cookTimeSeconds ?? 0,
      };
    });

    const deliveryFeeCents = 299;
    const totalCents = subtotalCents + deliveryFeeCents;

    if (dto.paymentMethod === PaymentMethod.CASH) {
      const cfg = await this.appConfig.get();
      if (totalCents > cfg.cashHardCapCents) {
        throw new BadRequestException("errors.badRequest");
      }
    }

    let scheduledAt: Date | undefined;
    if (dto.scheduledAt) {
      scheduledAt = new Date(dto.scheduledAt);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt.getTime() < Date.now()) {
        throw new BadRequestException("errors.badRequest");
      }
    }

    const order = await this.orders.create({
      customerId: new Types.ObjectId(userId),
      menuVersion: dto.menuVersion,
      lines,
      subtotalCents,
      deliveryFeeCents,
      totalCents,
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      addressId: address._id,
      deliveryLongitude: address.longitude,
      deliveryLatitude: address.latitude,
      notes: dto.notes,
      leaveAtDoor: dto.leaveAtDoor ?? false,
      scheduledAt,
      deliveryEntrance: dto.deliveryEntrance ?? address.entrance,
      deliveryFloor: dto.deliveryFloor ?? address.floor,
      deliveryUnit: dto.deliveryUnit ?? address.unit,
      deliveryDoorCode: dto.deliveryDoorCode ?? address.doorCode,
      deliveryInstructions: dto.deliveryInstructions ?? address.instructions,
    });

    return toCustomerView(order);
  }

  async listForCustomer(userId: string) {
    const docs = await this.orders
      .find({ customerId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
    return docs.map((d) => toCustomerView(d));
  }

  async getForCustomer(userId: string, orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order || String(order.customerId) !== userId) {
      throw new NotFoundException("errors.notFound");
    }
    return toCustomerView(order);
  }

  async getRaw(orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    return order;
  }

  listForAdminReview() {
    return this.orders
      .find({
        status: {
          $in: [OrderStatus.EXCEPTION_REPORTED, OrderStatus.ADMIN_REVIEW],
        },
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async listAtRisk() {
    const now = Date.now();
    const activeStatuses = [
      OrderStatus.PENDING_OFFERS,
      OrderStatus.ACCEPTED_BY_PROVIDER,
      OrderStatus.PREPARING,
      OrderStatus.READY_FOR_PICKUP,
      OrderStatus.ASSIGNED_TO_COURIER,
      OrderStatus.PICKED_UP,
      OrderStatus.ON_THE_WAY,
      OrderStatus.DELIVERED,
      OrderStatus.EXCEPTION_REPORTED,
      OrderStatus.ADMIN_REVIEW,
    ];

    const [exceptionOrders, openIncidents, activeOrders] = await Promise.all([
      this.orders
        .find({
          status: {
            $in: [OrderStatus.EXCEPTION_REPORTED, OrderStatus.ADMIN_REVIEW],
          },
        })
        .sort({ updatedAt: -1 })
        .limit(50)
        .exec(),
      this.incidents
        .find({
          status: {
            $in: [
              IncidentStatus.OPEN,
              IncidentStatus.WAITING,
              IncidentStatus.REASSIGNING,
            ],
          },
        })
        .sort({ createdAt: -1 })
        .limit(50)
        .exec(),
      this.orders
        .find({
          status: { $in: activeStatuses },
          etaDeliveryMax: { $exists: true },
        })
        .sort({ updatedAt: -1 })
        .limit(100)
        .exec(),
    ]);

    const delayedOrders = activeOrders.filter((order) => {
      const base = order.etaComputedAt ?? (order as OrderDocument & { createdAt?: Date }).createdAt;
      if (!base || order.etaDeliveryMax == null) return false;
      const deadline = base.getTime() + order.etaDeliveryMax * 60_000;
      return now > deadline;
    });

    const sosIncidents = openIncidents.filter((i) => i.workflow?.sos);

    return {
      exceptionOrders: exceptionOrders.map((o) => ({
        orderId: o.id,
        status: o.status,
        totalCents: o.totalCents,
        updatedAt: (o as OrderDocument & { updatedAt?: Date }).updatedAt,
        risk: "exception" as const,
      })),
      openIncidents: openIncidents.map((i) => ({
        incidentId: i.id,
        orderId: String(i.orderId),
        kind: i.kind,
        status: i.status,
        sos: Boolean(i.workflow?.sos),
        createdAt: (i as IncidentDocument & { createdAt?: Date }).createdAt,
      })),
      delayedOrders: delayedOrders.map((o) => ({
        orderId: o.id,
        status: o.status,
        totalCents: o.totalCents,
        etaDeliveryMax: o.etaDeliveryMax,
        etaComputedAt: o.etaComputedAt,
        risk: "delayed_eta" as const,
      })),
      sosOrderIds: [...sosIncidents.map((i) => String(i.orderId))],
      summary: {
        exceptionCount: exceptionOrders.length,
        openIncidentCount: openIncidents.length,
        delayedCount: delayedOrders.length,
        sosCount: sosIncidents.length,
      },
    };
  }

  async buildReorderPreview(userId: string, orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order || String(order.customerId) !== userId) {
      throw new NotFoundException("errors.notFound");
    }

    const menu = await this.catalog.getPublishedMenu();
    if (!menu.version) {
      throw new BadRequestException("errors.badRequest");
    }

    const publishedById = new Map(
      (
        await this.catalog.getActiveItemsByIds(
          order.lines.map((l) => String(l.menuItemId)),
          menu.version.version,
        )
      ).items.map((i) => [i.id, i]),
    );

    const publishedItems = menu.items ?? [];
    const publishedByName = new Map(
      publishedItems.map((i) => [i.name.toLowerCase(), i]),
    );

    const available: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
      previousUnitPriceCents: number;
    }> = [];
    const changed: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      unitPriceCents: number;
      previousUnitPriceCents: number;
      change: "price";
    }> = [];
    const unavailable: Array<{
      menuItemId: string;
      name: string;
      quantity: number;
      reason: string;
    }> = [];

    for (const line of order.lines) {
      const byId = publishedById.get(String(line.menuItemId));
      const match =
        byId ??
        publishedByName.get(line.name.toLowerCase()) ??
        null;

      if (!match) {
        unavailable.push({
          menuItemId: String(line.menuItemId),
          name: line.name,
          quantity: line.quantity,
          reason: "not_on_menu",
        });
        continue;
      }

      const currentPrice = match.priceCents;
      if (currentPrice !== line.unitPriceCents) {
        changed.push({
          menuItemId: match.id,
          name: match.name,
          quantity: line.quantity,
          unitPriceCents: currentPrice,
          previousUnitPriceCents: line.unitPriceCents,
          change: "price",
        });
      } else {
        available.push({
          menuItemId: match.id,
          name: match.name,
          quantity: line.quantity,
          unitPriceCents: currentPrice,
          previousUnitPriceCents: line.unitPriceCents,
        });
      }
    }

    const cartLines = [...available, ...changed].map((l) => ({
      menuItemId: l.menuItemId,
      name: l.name,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
    }));
    const subtotalCents = cartLines.reduce(
      (sum, l) => sum + l.unitPriceCents * l.quantity,
      0,
    );

    return {
      sourceOrderId: order.id,
      menuVersion: menu.version.version,
      available,
      changed,
      unavailable,
      cartLines,
      subtotalCents,
      deliveryFeeCents: order.deliveryFeeCents,
      estimatedTotalCents: subtotalCents + order.deliveryFeeCents,
    };
  }

  async resolveAdminReview(orderId: string, dto: ResolveAdminReviewDto) {
    if (!ADMIN_RESOLVE_STATUSES.has(dto.status)) {
      throw new BadRequestException("errors.badRequest");
    }
    const order = await this.getRaw(orderId);
    if (
      order.status !== OrderStatus.EXCEPTION_REPORTED &&
      order.status !== OrderStatus.ADMIN_REVIEW
    ) {
      throw new BadRequestException("errors.badRequest");
    }
    order.status = dto.status;
    await order.save();

    if (dto.status === OrderStatus.CANCELLED && order.providerId) {
      await this.providersService.bumpOpenOrders(String(order.providerId), -1);
    }

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
    return order;
  }

  listKitchenForProvider(providerId: string) {
    return this.orders
      .find({
        providerId: new Types.ObjectId(providerId),
        status: {
          $in: [
            OrderStatus.ACCEPTED_BY_PROVIDER,
            OrderStatus.PREPARING,
            OrderStatus.READY_FOR_PICKUP,
            OrderStatus.EXCEPTION_REPORTED,
          ],
        },
      })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async updateKitchenStatus(
    providerUserId: string,
    orderId: string,
    dto: UpdateKitchenStatusDto,
    providerId: string,
  ) {
    const order = await this.getRaw(orderId);
    if (!order.providerId || String(order.providerId) !== providerId) {
      throw new ForbiddenException("errors.forbidden");
    }
    const allowed = KITCHEN_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException("errors.badRequest");
    }

    if (dto.status === OrderStatus.READY_FOR_PICKUP) {
      await this.quality.assertHandoffReady(order);
    }

    order.status = dto.status;
    if (dto.status === OrderStatus.READY_FOR_PICKUP) {
      order.readyAt = new Date();
    }
    await order.save();

    if (
      dto.status === OrderStatus.READY_FOR_PICKUP ||
      dto.status === OrderStatus.PREPARING
    ) {
      await this.eta.applyAndSave(order, {
        quotedPrepMinutes:
          order.prepOverrideMinutes ?? order.quotedPrepMinutes,
      });
    }

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
    return order;
  }

  async setPrepOverride(
    providerId: string,
    orderId: string,
    dto: PrepOverrideDto,
  ) {
    const order = await this.getRaw(orderId);
    if (!order.providerId || String(order.providerId) !== providerId) {
      throw new ForbiddenException("errors.forbidden");
    }
    order.prepOverrideMinutes = dto.prepOverrideMinutes;
    await this.eta.applyAndSave(order, {
      quotedPrepMinutes: dto.prepOverrideMinutes,
    });
    return order;
  }

  /**
   * Customer-facing courier coords only — never leak provider identity.
   */
  async getCourierLocationForCustomer(userId: string, orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order || String(order.customerId) !== userId) {
      throw new NotFoundException("errors.notFound");
    }
    if (!order.courierId) {
      return { longitude: null, latitude: null, updatedAt: null };
    }

    const session = await this.courierSessions
      .findOne({
        courierId: order.courierId,
        status: "active",
      })
      .sort({ updatedAt: -1 })
      .exec();

    if (
      !session ||
      session.lastLongitude == null ||
      session.lastLatitude == null
    ) {
      return { longitude: null, latitude: null, updatedAt: null };
    }

    return {
      longitude: session.lastLongitude,
      latitude: session.lastLatitude,
      updatedAt: session.locationUpdatedAt ?? null,
    };
  }

  async markFailedCash(orderId: string) {
    const order = await this.getRaw(orderId);
    if (order.paymentMethod !== PaymentMethod.CASH) {
      throw new BadRequestException("errors.badRequest");
    }
    if (
      order.status === OrderStatus.FAILED_CASH ||
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException("errors.badRequest");
    }

    order.status = OrderStatus.FAILED_CASH;
    order.paymentStatus = PaymentStatus.FAILED;
    await order.save();

    if (order.providerId) {
      await this.providersService.bumpOpenOrders(String(order.providerId), -1);
    }

    const cfg = await this.appConfig.get();
    const user = await this.accounts.findById(String(order.customerId));
    if (user) {
      user.failedCashCount += 1;
      this.accounts.applyCashTrustFailed(user);
      if (user.failedCashCount >= cfg.cashFailThreshold) {
        user.cashBanned = true;
        user.cashTrustTier = "banned";
      }
      await user.save();
    }

    this.realtime.emitOrderStatus(
      order.id,
      String(order.customerId),
      order.status,
    );
    return order;
  }

  toCustomerView = toCustomerView;
}

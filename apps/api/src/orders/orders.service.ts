import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AccountService } from "../account/account.service";
import { CatalogService } from "../catalog/catalog.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import {
  CourierSession,
  CourierSessionDocument,
} from "../couriers/schemas/courier.schema";
import { PushService } from "../push/push.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  CreateAddressDto,
  CreateOrderDto,
  ResolveAdminReviewDto,
  UpdateKitchenStatusDto,
} from "./dto/order.dto";
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
    private readonly catalog: CatalogService,
    private readonly accounts: AccountService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
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
      };
    });

    const deliveryFeeCents = 299;
    const order = await this.orders.create({
      customerId: new Types.ObjectId(userId),
      menuVersion: dto.menuVersion,
      lines,
      subtotalCents,
      deliveryFeeCents,
      totalCents: subtotalCents + deliveryFeeCents,
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: dto.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      addressId: address._id,
      deliveryLongitude: address.longitude,
      deliveryLatitude: address.latitude,
      notes: dto.notes,
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
    order.status = dto.status;
    await order.save();

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
    order.status = OrderStatus.FAILED_CASH;
    order.paymentStatus = PaymentStatus.FAILED;
    await order.save();

    const user = await this.accounts.findById(String(order.customerId));
    if (user) {
      user.failedCashCount += 1;
      const threshold = 1;
      if (user.failedCashCount >= threshold) {
        user.cashBanned = true;
      }
      await user.save();
    }
    return order;
  }

  toCustomerView = toCustomerView;
}

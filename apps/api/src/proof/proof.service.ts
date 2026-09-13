import { MediaService } from "../media/media.module";
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { randomInt } from "crypto";
import { Batch, BatchDocument } from "../batches/schemas/batch.schema";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { ProvidersService } from "../providers/providers.service";
import { SlaService } from "../sla/sla.service";
import { PushService } from "../push/push.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import {
  CashReceiptDto,
  DeliverProofDto,
  EnRouteDto,
  PickupProofDto,
} from "./dto/proof.dto";
import {
  DeliveryProof,
  DeliveryProofDocument,
} from "./schemas/delivery-proof.schema";

@Injectable()
export class ProofService {
  constructor(
    @InjectModel(DeliveryProof.name)
    private readonly proofs: Model<DeliveryProofDocument>,
    @InjectModel(Batch.name) private readonly batches: Model<BatchDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly providers: ProvidersService,
    private readonly config: AppConfigService,
    private readonly realtime: RealtimeGateway,
    private readonly push: PushService,
    private readonly sla: SlaService,
    private readonly media: MediaService,
  ) {}

  /**
   * Generate pickup code + door PIN when courier is assigned.
   */
  async ensureCodes(order: OrderDocument) {
    let dirty = false;
    if (!order.pickupCode) {
      order.pickupCode = String(randomInt(100000, 999999));
      dirty = true;
    }
    if (!order.doorPin) {
      order.doorPin = String(randomInt(1000, 9999));
      dirty = true;
    }
    if (dirty) await order.save();
    return order;
  }

  async getOrCreateProof(orderId: string, courierId: string) {
    let proof = await this.proofs
      .findOne({ orderId: new Types.ObjectId(orderId) })
      .exec();
    if (!proof) {
      proof = await this.proofs.create({
        orderId: new Types.ObjectId(orderId),
        courierId: new Types.ObjectId(courierId),
        custodyLog: [],
      });
    }
    return proof;
  }

  async pickup(courierId: string, orderId: string, dto: PickupProofDto) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (String(order.courierId) !== courierId) {
      throw new ForbiddenException("errors.forbidden");
    }
    if (order.status !== OrderStatus.ASSIGNED_TO_COURIER) {
      throw new BadRequestException("errors.badRequest");
    }

    await this.ensureCodes(order);
    const code = dto.code.trim();
    if (code !== order.pickupCode) {
      throw new BadRequestException("errors.otpInvalid");
    }
    if (order.sealId && dto.sealId !== order.sealId) {
      throw new BadRequestException("errors.badRequest");
    }

    if (order.providerId) {
      const provider = await this.providers.getById(String(order.providerId));
      const cfg = await this.config.get();
      const dist = this.haversineMeters(
        dto.latitude,
        dto.longitude,
        provider.latitude,
        provider.longitude,
      );
      if (dist > (cfg.pickupGeoRadiusMeters ?? 250)) {
        throw new BadRequestException("errors.badRequest");
      }
    }

    const proof = await this.getOrCreateProof(orderId, courierId);
    const now = new Date();
    proof.pickupCodeUsed = code;
    proof.sealId = dto.sealId ?? order.sealId;
    proof.pickupAt = now;
    proof.pickupLongitude = dto.longitude;
    proof.pickupLatitude = dto.latitude;
    proof.custodyLog.push({
      at: now,
      event: "picked_up",
      courierId: new Types.ObjectId(courierId),
      longitude: dto.longitude,
      latitude: dto.latitude,
      note: proof.sealId ? `seal:${proof.sealId}` : undefined,
    });
    await proof.save();

    order.status = OrderStatus.PICKED_UP;
    order.proofId = proof._id as Types.ObjectId;
    await order.save();
    this.emitStatus(order);

    return { orderId: order.id, status: order.status, proofId: proof.id };
  }

  async markEnRoute(courierId: string, orderId: string, dto: EnRouteDto) {
    const order = await this.assertCourierOrder(
      courierId,
      orderId,
      OrderStatus.PICKED_UP,
    );
    const proof = await this.getOrCreateProof(orderId, courierId);
    const now = new Date();
    proof.custodyLog.push({
      at: now,
      event: "on_the_way",
      courierId: new Types.ObjectId(courierId),
      longitude: dto.longitude,
      latitude: dto.latitude,
    });
    await proof.save();

    order.status = OrderStatus.ON_THE_WAY;
    await order.save();
    this.emitStatus(order);
    return { orderId: order.id, status: order.status };
  }

  async deliver(courierId: string, orderId: string, dto: DeliverProofDto) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (String(order.courierId) !== courierId) {
      throw new ForbiddenException("errors.forbidden");
    }
    if (
      order.status !== OrderStatus.ON_THE_WAY &&
      order.status !== OrderStatus.PICKED_UP
    ) {
      throw new BadRequestException("errors.badRequest");
    }

    await this.ensureCodes(order);
    const hasPin = Boolean(dto.pin?.trim());
    await this.media.assertReference(dto.signatureUrl, orderId, "signature");
    await this.media.assertReference(dto.photoUrl, orderId, "dropoff");
    const hasSign = Boolean(dto.signatureUrl?.trim());
    const hasPhoto = Boolean(dto.photoUrl?.trim());
    if (!hasPin && !hasSign && !hasPhoto) {
      throw new BadRequestException("errors.badRequest");
    }
    if (hasPin && dto.pin!.trim() !== order.doorPin) {
      throw new BadRequestException("errors.otpInvalid");
    }

    if (order.deliveryLatitude != null && order.deliveryLongitude != null) {
      const cfg = await this.config.get();
      const dist = this.haversineMeters(
        dto.latitude,
        dto.longitude,
        order.deliveryLatitude,
        order.deliveryLongitude,
      );
      if (dist > (cfg.dropoffGeoRadiusMeters ?? 150)) {
        throw new BadRequestException("errors.badRequest");
      }
    }

    const proof = await this.getOrCreateProof(orderId, courierId);
    const now = new Date();
    proof.doorPinUsed = dto.pin?.trim();
    proof.signatureUrl = dto.signatureUrl;
    proof.dropoffPhotoUrl = dto.photoUrl;
    proof.deliveredAt = now;
    proof.dropoffLongitude = dto.longitude;
    proof.dropoffLatitude = dto.latitude;
    proof.custodyLog.push({
      at: now,
      event: "delivered",
      courierId: new Types.ObjectId(courierId),
      longitude: dto.longitude,
      latitude: dto.latitude,
    });
    await proof.save();

    order.deliveredAt = now;
    order.status = OrderStatus.DELIVERED;
    order.proofId = proof._id as Types.ObjectId;
    await order.save();
    this.emitStatus(order);
    return { orderId: order.id, status: order.status, proofId: proof.id };
  }

  async cashReceipt(courierId: string, orderId: string, dto: CashReceiptDto) {
    const order = await this.assertCourierOrder(
      courierId,
      orderId,
      OrderStatus.DELIVERED,
    );
    if (
      order.paymentMethod !== PaymentMethod.CASH ||
      dto.amountCents !== order.totalCents
    ) {
      throw new BadRequestException("errors.badRequest");
    }
    const proof = await this.getOrCreateProof(orderId, courierId);
    proof.cashReceiptAmountCents = dto.amountCents;
    proof.cashReceiptAt = new Date();
    proof.custodyLog.push({
      at: proof.cashReceiptAt,
      event: "cash_receipt",
      courierId: new Types.ObjectId(courierId),
      note: `amountCents:${dto.amountCents}`,
    });
    await proof.save();
    order.paymentStatus = PaymentStatus.CAPTURED;
    await order.save();
    return {
      orderId: order.id,
      cashReceiptAmountCents: dto.amountCents,
      cashReceiptAt: proof.cashReceiptAt,
    };
  }

  async complete(courierId: string, orderId: string) {
    const order = await this.assertCourierOrder(
      courierId,
      orderId,
      OrderStatus.DELIVERED,
    );
    const proof = await this.proofs
      .findOne({ orderId: new Types.ObjectId(orderId) })
      .exec();
    if (!proof?.deliveredAt) {
      throw new BadRequestException("errors.badRequest");
    }
    if (
      order.paymentMethod === PaymentMethod.CASH &&
      proof.cashReceiptAmountCents == null
    ) {
      throw new BadRequestException("errors.badRequest");
    }

    order.status = OrderStatus.COMPLETED;
    order.completedAt = new Date();
    if (order.paymentMethod === PaymentMethod.CASH) {
      order.paymentStatus = PaymentStatus.CAPTURED;
    }
    await order.save();

    if (order.providerId) {
      await this.providers.bumpOpenOrders(String(order.providerId), -1);
    }
    if (order.batchId) {
      const remaining = await this.orders.countDocuments({
        batchId: order.batchId,
        status: {
          $nin: [
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
            OrderStatus.FAILED_CASH,
          ],
        },
      });
      if (!remaining)
        await this.batches
          .updateOne({ _id: order.batchId }, { status: "completed" })
          .exec();
    }

    proof.custodyLog.push({
      at: new Date(),
      event: "completed",
      courierId: new Types.ObjectId(courierId),
    });
    await proof.save();
    this.emitStatus(order);
    await this.sla.evaluateOrder(order.id);
    return { orderId: order.id, status: order.status };
  }

  async getForCourier(courierId: string, orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order || String(order.courierId) !== courierId) {
      throw new NotFoundException("errors.notFound");
    }
    const provider = order.providerId
      ? await this.providers.getById(String(order.providerId))
      : null;
    const proof = await this.proofs
      .findOne({ orderId: new Types.ObjectId(orderId) })
      .exec();
    return {
      orderId: order.id,
      status: order.status,
      pickup: provider
        ? {
            address: provider.address,
            longitude: provider.longitude,
            latitude: provider.latitude,
          }
        : undefined,
      totalCents: order.totalCents,
      deliveryStreet: order.deliveryStreet,
      deliveryCity: order.deliveryCity,
      deliveryZipcode: order.deliveryZipcode,
      deliveryLongitude: order.deliveryLongitude,
      deliveryLatitude: order.deliveryLatitude,
      deliveryEntrance: order.deliveryEntrance,
      deliveryFloor: order.deliveryFloor,
      deliveryUnit: order.deliveryUnit,
      deliveryDoorCode: order.deliveryDoorCode,
      deliveryInstructions: order.deliveryInstructions,
      leaveAtDoor: order.leaveAtDoor,
      sealId: order.sealId,
      hasDoorPin: Boolean(order.doorPin),
      paymentMethod: order.paymentMethod,
      proof,
    };
  }

  /** Admin / internal: codes for kitchen display */
  async getPickupCodes(orderId: string, providerUserId?: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (providerUserId) {
      const provider = await this.providers.getSelf(providerUserId);
      if (String(order.providerId) !== provider.id)
        throw new ForbiddenException("errors.forbidden");
    }
    await this.ensureCodes(order);
    return {
      orderId: order.id,
      pickupCode: order.pickupCode,
      sealId: order.sealId,
    };
  }

  private async assertCourierOrder(
    courierId: string,
    orderId: string,
    expected: OrderStatus,
  ) {
    const order = await this.orders.findById(orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (String(order.courierId) !== courierId) {
      throw new ForbiddenException("errors.forbidden");
    }
    if (order.status !== expected) {
      throw new BadRequestException("errors.badRequest");
    }
    return order;
  }

  private emitStatus(order: OrderDocument) {
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

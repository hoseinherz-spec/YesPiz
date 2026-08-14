import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { AppConfigService } from "../app-config/app-config.service";
import { MAX_BATCH_SIZE, OrderStatus } from "../common/enums";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import {
  AssignCourierDto,
  CreateBatchDto,
  ReduceBatchDto,
} from "./dto/batch.dto";
import { Batch, BatchDocument } from "./schemas/batch.schema";

@Injectable()
export class BatchesService {
  constructor(
    @InjectModel(Batch.name) private readonly batches: Model<BatchDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly appConfig: AppConfigService,
  ) {}

  async create(dto: CreateBatchDto) {
    const cfg = await this.appConfig.get();
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    if (dto.orderIds.length > max) {
      throw new BadRequestException("errors.badRequest");
    }

    const orders = await this.orders
      .find({
        _id: { $in: dto.orderIds.map((id) => new Types.ObjectId(id)) },
        providerId: new Types.ObjectId(dto.providerId),
        status: {
          $in: [OrderStatus.READY_FOR_PICKUP, OrderStatus.PREPARING],
        },
      })
      .exec();

    if (orders.length !== dto.orderIds.length) {
      throw new BadRequestException("errors.badRequest");
    }

    const totalPrepWeight = orders.reduce(
      (sum, o) =>
        sum + o.lines.reduce((s, l) => s + l.prepWeight * l.quantity, 0),
      0,
    );

    const batch = await this.batches.create({
      providerId: new Types.ObjectId(dto.providerId),
      orderIds: orders.map((o) => o._id),
      totalPrepWeight,
      status: "open",
    });

    await this.orders
      .updateMany(
        { _id: { $in: orders.map((o) => o._id) } },
        { batchId: batch._id },
      )
      .exec();

    return batch;
  }

  async suggest(providerId: string) {
    const cfg = await this.appConfig.get();
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    const ready = await this.orders
      .find({
        providerId: new Types.ObjectId(providerId),
        status: OrderStatus.READY_FOR_PICKUP,
        batchId: { $exists: false },
      })
      .sort({ createdAt: 1 })
      .limit(max)
      .exec();

    return {
      providerId,
      suggestedOrderIds: ready.map((o) => o.id),
      maxBatchSize: max,
    };
  }

  async reduce(batchId: string, providerId: string, dto: ReduceBatchDto) {
    const batch = await this.batches.findById(batchId).exec();
    if (!batch || String(batch.providerId) !== providerId) {
      throw new NotFoundException("errors.notFound");
    }
    const cfg = await this.appConfig.get();
    const max = cfg.maxBatchSize || MAX_BATCH_SIZE;
    if (dto.keepOrderIds.length > max) {
      throw new BadRequestException("errors.badRequest");
    }

    const keep = new Set(dto.keepOrderIds);
    const removed = batch.orderIds.filter((id) => !keep.has(String(id)));
    batch.orderIds = batch.orderIds.filter((id) => keep.has(String(id)));
    if (batch.orderIds.length === 0) {
      throw new BadRequestException("errors.badRequest");
    }

    if (removed.length) {
      await this.orders
        .updateMany({ _id: { $in: removed } }, { $unset: { batchId: 1 } })
        .exec();
    }

    const orders = await this.orders
      .find({ _id: { $in: batch.orderIds } })
      .exec();
    batch.totalPrepWeight = orders.reduce(
      (sum, o) =>
        sum + o.lines.reduce((s, l) => s + l.prepWeight * l.quantity, 0),
      0,
    );
    await batch.save();
    return batch;
  }

  async assignCourier(batchId: string, dto: AssignCourierDto) {
    const batch = await this.batches.findById(batchId).exec();
    if (!batch) throw new NotFoundException("errors.notFound");
    if (batch.orderIds.length > MAX_BATCH_SIZE) {
      throw new BadRequestException("errors.badRequest");
    }

    batch.courierId = new Types.ObjectId(dto.courierId);
    batch.status = "assigned";
    await batch.save();

    await this.orders
      .updateMany(
        { _id: { $in: batch.orderIds } },
        {
          courierId: batch.courierId,
          status: OrderStatus.ASSIGNED_TO_COURIER,
        },
      )
      .exec();

    return batch;
  }

  get(batchId: string) {
    return this.batches.findById(batchId).exec();
  }

  listForProvider(providerId: string) {
    return this.batches
      .find({ providerId: new Types.ObjectId(providerId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  listForCourier(courierUserId: string) {
    return this.batches
      .find({
        courierId: new Types.ObjectId(courierUserId),
        status: { $in: ["assigned", "in_progress", "open"] },
      })
      .sort({ createdAt: -1 })
      .exec();
  }
}

import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  Param,
  Patch,
  Delete,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  Prop,
  Schema,
  SchemaFactory,
  InjectModel,
  MongooseModule,
} from "@nestjs/mongoose";
import { Model, Types, type HydratedDocument } from "mongoose";
import { IsDateString, IsInt, Max, Min } from "class-validator";
import { randomUUID } from "crypto";
import { RedisService } from "../redis/redis.service";
import {
  Order,
  OrderSchema,
  OrderDocument,
} from "../orders/schemas/order.schema";
import { OrderStatus } from "../common/enums";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
@Schema({ timestamps: true, collection: "delivery_slots" })
class DeliverySlot {
  @Prop({ required: true }) startsAt!: Date;
  @Prop({ required: true }) endsAt!: Date;
  @Prop({ required: true }) capacityUnits!: number;
  @Prop({ required: true }) maxOrders!: number;
  @Prop({ default: 45 }) leadMinutes!: number;
  @Prop({ default: 0 }) revision!: number;
  @Prop({ default: false }) archived!: boolean;
}
const DeliverySlotSchema = SchemaFactory.createForClass(DeliverySlot);
DeliverySlotSchema.index({ startsAt: 1 });
class SlotDto {
  @IsDateString() startsAt!: string;
  @IsDateString() endsAt!: string;
  @IsInt() @Min(1) @Max(500) capacityUnits!: number;
  @IsInt() @Min(1) @Max(100) maxOrders!: number;
  @IsInt() @Min(20) @Max(120) leadMinutes!: number;
}
class UpdateSlotDto extends SlotDto {
  @IsInt() @Min(0) revision!: number;
}
class RemoveSlotDto {
  @IsInt() @Min(0) revision!: number;
}
@Injectable()
export class SlotsService {
  constructor(
    @InjectModel(DeliverySlot.name)
    private readonly slots: Model<HydratedDocument<DeliverySlot>>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly redis: RedisService,
  ) {}
  async details(id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException("Invalid delivery window.");
    const slot = await this.slots.findById(id).exec();
    if (
      !slot ||
      slot.archived ||
      slot.startsAt.getTime() - slot.leadMinutes * 60000 <
        Date.now() + 15 * 60000
    )
      throw new BadRequestException(
        "This delivery window is no longer available. Choose another.",
      );
    return slot;
  }
  private async usageBySlot(ids: string[]) {
    // Count paid receipts even if the process stopped before persisting the order status.
    const rows = await this.orders.aggregate([
      {
        $match: {
          deliverySlotId: { $in: ids },
          status: { $nin: [OrderStatus.CANCELLED, OrderStatus.FAILED_CASH] },
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "orderId",
          as: "receipts",
        },
      },
      {
        $match: {
          $or: [
            { status: { $ne: OrderStatus.PENDING_PAYMENT } },
            { slotHoldUntil: { $gt: new Date() } },
            { "receipts.status": { $in: ["captured", "authorized"] } },
          ],
        },
      },
      {
        $group: {
          _id: "$deliverySlotId",
          orders: { $sum: 1 },
          units: { $sum: { $sum: "$lines.quantity" } },
        },
      },
    ]);
    return new Map<string, { orders: number; units: number }>(
      rows.map((row) => [row._id, { orders: row.orders, units: row.units }]),
    );
  }
  async list() {
    const slots = (
      await this.slots
        .find({
          archived: { $ne: true },
          startsAt: {
            $gte: new Date(Date.now() + 35 * 60000),
            $lte: new Date(Date.now() + 7 * 86400000),
          },
        })
        .sort({ startsAt: 1 })
        .limit(80)
        .exec()
    ).filter(
      (s) =>
        s.startsAt.getTime() - s.leadMinutes * 60000 > Date.now() + 15 * 60000,
    );
    const usage = await this.usageBySlot(slots.map((s) => s.id));
    return slots.map((s) => {
      const used = usage.get(s.id) ?? { orders: 0, units: 0 };
      return {
        id: s.id,
        startsAt: s.startsAt,
        endsAt: s.endsAt,
        remainingUnits: Math.max(0, s.capacityUnits - used.units),
        remainingOrders: Math.max(0, s.maxOrders - used.orders),
      };
    });
  }
  private validate(dto: SlotDto) {
    const startsAt = new Date(dto.startsAt),
      endsAt = new Date(dto.endsAt);
    if (
      startsAt.getTime() < Date.now() + (dto.leadMinutes + 15) * 60000 ||
      endsAt.getTime() - startsAt.getTime() < 15 * 60000 ||
      endsAt.getTime() - startsAt.getTime() > 60 * 60000 ||
      startsAt.getTime() > Date.now() + 7 * 86400000
    )
      throw new BadRequestException(
        "Choose a future 15–60 minute window within seven days.",
      );
    return { startsAt, endsAt };
  }
  async create(dto: SlotDto) {
    return this.slots.create({ ...dto, ...this.validate(dto) });
  }
  async manage() {
    const slots = await this.slots
      .find({ archived: { $ne: true }, endsAt: { $gte: new Date() } })
      .sort({ startsAt: 1 })
      .limit(100)
      .exec();
    const usage = await this.usageBySlot(slots.map((s) => s.id));
    return slots.map((s) => ({
      id: s.id,
      startsAt: s.startsAt,
      endsAt: s.endsAt,
      capacityUnits: s.capacityUnits,
      maxOrders: s.maxOrders,
      leadMinutes: s.leadMinutes,
      revision: s.revision ?? 0,
      usedUnits: usage.get(s.id)?.units ?? 0,
      usedOrders: usage.get(s.id)?.orders ?? 0,
    }));
  }
  async change(id: string, revision: number, dto?: SlotDto) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException("Invalid delivery window.");
    const key = `slot:${id}`,
      owner = randomUUID();
    if (!(await this.redis.acquireLock(key, owner, 120000)))
      throw new ConflictException("This window is updating. Please retry.");
    try {
      const slot = await this.slots.findById(id).exec();
      if (!slot || slot.archived || (slot.revision ?? 0) !== revision)
        throw new ConflictException("Window changed. Refresh before editing.");
      const used = (await this.usageBySlot([id])).get(id) ?? {
        orders: 0,
        units: 0,
      };
      if (!dto && used.orders)
        throw new ConflictException(
          "A reserved window cannot be removed. Existing delivery promises must be honoured.",
        );
      if (dto) {
        this.validate(dto);
        if (dto.capacityUnits < used.units || dto.maxOrders < used.orders)
          throw new ConflictException(
            "Capacity cannot be lower than existing reservations.",
          );
        if (
          used.orders &&
          (new Date(dto.startsAt).getTime() !== slot.startsAt.getTime() ||
            new Date(dto.endsAt).getTime() !== slot.endsAt.getTime() ||
            dto.leadMinutes !== slot.leadMinutes)
        )
          throw new ConflictException(
            "Arrival time and preparation lead cannot change while reservations exist.",
          );
      }
      const revisionFilter =
        revision === 0
          ? { $or: [{ revision: 0 }, { revision: { $exists: false } }] }
          : { revision };
      const updated = await this.slots
        .findOneAndUpdate(
          { _id: id, ...revisionFilter },
          {
            $set: dto
              ? {
                  startsAt: new Date(dto.startsAt),
                  endsAt: new Date(dto.endsAt),
                  capacityUnits: dto.capacityUnits,
                  maxOrders: dto.maxOrders,
                  leadMinutes: dto.leadMinutes,
                }
              : { archived: true },
            $inc: { revision: 1 },
          },
          { new: true },
        )
        .exec();
      if (!updated)
        throw new ConflictException("Window changed. Refresh before editing.");
      return {
        id: updated.id,
        revision: updated.revision,
        archived: updated.archived,
      };
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }
  async reserve<T>(slotId: string, units: number, work: () => Promise<T>) {
    const key = `slot:${slotId}`,
      owner = randomUUID();
    if (!(await this.redis.acquireLock(key, owner, 120000)))
      throw new ConflictException("This window is updating. Please retry.");
    try {
      const slot = await this.details(slotId),
        used = (await this.usageBySlot([slotId])).get(slotId) ?? {
          orders: 0,
          units: 0,
        };
      if (
        used.orders >= slot.maxOrders ||
        used.units + units > slot.capacityUnits
      )
        throw new ConflictException(
          "This delivery window is full. Choose another.",
        );
      return await work();
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }
}
@Controller("delivery-slots")
class SlotsController {
  constructor(private readonly service: SlotsService) {}
  @Get() list() {
    return this.service.list();
  }
  @Get("manage")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  manage() {
    return this.service.manage();
  }
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  update(@Param("id") id: string, @Body() dto: UpdateSlotDto) {
    return this.service.change(id, dto.revision, dto);
  }
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  remove(@Param("id") id: string, @Body() dto: RemoveSlotDto) {
    return this.service.change(id, dto.revision);
  }
  @Post() @UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN) create(
    @Body() dto: SlotDto,
  ) {
    return this.service.create(dto);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeliverySlot.name, schema: DeliverySlotSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  controllers: [SlotsController],
  providers: [SlotsService],
  exports: [SlotsService],
})
export class SlotsModule {}

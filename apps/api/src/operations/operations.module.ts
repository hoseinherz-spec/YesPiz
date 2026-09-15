import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Module,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  InjectModel,
  MongooseModule,
  Prop,
  Schema,
  SchemaFactory,
} from "@nestjs/mongoose";
import { Model, Types, type HydratedDocument } from "mongoose";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsMongoId,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ArrayMaxSize,
} from "class-validator";
import { User, UserDocument, UserSchema } from "../account/schemas/user.schema";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
import {
  DeliveryProof,
  DeliveryProofDocument,
  DeliveryProofSchema,
} from "../proof/schemas/delivery-proof.schema";
import {
  PushNotification,
  PushNotificationDocument,
  PushNotificationSchema,
} from "../push/schemas/push-notification.schema";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { UserRole } from "../common/enums";
import { ADMIN_PERMISSIONS } from "../common/security/admin-permissions";
class AccessDto {
  @IsBoolean() fullAccess!: boolean;
  @IsInt() @Min(0) revision!: number;
  @IsArray()
  @ArrayMaxSize(10)
  @IsIn(ADMIN_PERMISSIONS, { each: true })
  permissions!: string[];
}
@Schema({ timestamps: true, collection: "cash_remittances" })
class CashRemittance {
  @Prop({ required: true, unique: true }) requestId!: string;
  @Prop({ required: true }) courierId!: string;
  @Prop({ required: true }) amountCents!: number;
  @Prop({ required: true }) reference!: string;
  @Prop({ required: true }) recordedBy!: string;
  @Prop() voidedAt?: Date;
  @Prop() voidedBy?: string;
  @Prop() voidReason?: string;
}
const CashRemittanceSchema = SchemaFactory.createForClass(CashRemittance);
CashRemittanceSchema.index({ courierId: 1, createdAt: -1 });
class RemittanceDto {
  @IsUUID() requestId!: string;
  @IsMongoId() courierId!: string;
  @IsInt() @Min(1) @Max(10000000) amountCents!: number;
  @IsString() @MaxLength(120) reference!: string;
}
class VoidReceiptDto {
  @IsString() @MaxLength(200) reason!: string;
}
@Controller("team-access")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class AccessController {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}
  @Get() async list() {
    const users = await this.users
      .find({ roles: UserRole.ADMIN })
      .select(
        "firstName lastName adminPermissions adminPermissionsRevision adminAccessAudit",
      )
      .limit(100)
      .lean()
      .exec();
    return {
      permissions: ADMIN_PERMISSIONS,
      users: users.map(({ adminAccessAudit: _audit, ...user }) => user),
      events: users
        .flatMap((u) =>
          (u.adminAccessAudit ?? []).map((e) => ({
            _id: `${u._id}:${e.revision}`,
            actorId: e.actorId,
            targetId: String(u._id),
            fullAccess: e.fullAccess,
            createdAt: e.at,
          })),
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 50),
    };
  }
  @Post(":id") async update(
    @CurrentUser() u: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: AccessDto,
  ) {
    if (!Types.ObjectId.isValid(id) || id === u.userId)
      throw new BadRequestException(
        "Edit another administrator to preserve your own full access.",
      );
    const permissions = [
      ...new Set([
        ...dto.permissions,
        ...dto.permissions
          .filter((p) => p.endsWith(":write"))
          .map((p) => p.replace(":write", ":read")),
      ]),
    ];
    const filter = {
      _id: id,
      roles: UserRole.ADMIN,
      ...(dto.revision === 0
        ? {
            $or: [
              { adminPermissionsRevision: 0 },
              { adminPermissionsRevision: { $exists: false } },
            ],
          }
        : { adminPermissionsRevision: dto.revision }),
    };
    const user = await this.users
      .findOneAndUpdate(
        filter,
        {
          ...(dto.fullAccess
            ? { $unset: { adminPermissions: 1 } }
            : { $set: { adminPermissions: permissions } }),
          $inc: { adminPermissionsRevision: 1 },
          $push: {
            adminAccessAudit: {
              $each: [
                {
                  actorId: u.userId,
                  permissions,
                  fullAccess: dto.fullAccess,
                  at: new Date(),
                  revision: dto.revision + 1,
                },
              ],
              $slice: -50,
            },
          },
        },
        { new: true },
      )
      .exec();
    if (!user)
      throw new ConflictException(
        "Team access changed. Refresh and review again.",
      );
    return { saved: true };
  }
}
@Controller("finance/cash")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class CashController {
  constructor(
    @InjectModel(CashRemittance.name)
    private readonly receipts: Model<HydratedDocument<CashRemittance>>,
    @InjectModel(DeliveryProof.name)
    private readonly proofs: Model<DeliveryProofDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}
  async onModuleInit() {
    await this.receipts.init();
  }
  @Get() async summary() {
    const [collected, remitted, receipts] = await Promise.all([
      this.proofs.aggregate([
        { $match: { cashReceiptAt: { $exists: true } } },
        {
          $group: {
            _id: { $toString: "$courierId" },
            collectedCents: { $sum: "$cashReceiptAmountCents" },
          },
        },
      ]),
      this.receipts.aggregate([
        { $match: { voidedAt: { $exists: false } } },
        {
          $group: {
            _id: "$courierId",
            remittedCents: { $sum: "$amountCents" },
          },
        },
      ]),
      this.receipts.find().sort({ createdAt: -1 }).limit(100).lean().exec(),
    ]);
    const ids = [
      ...new Set([...collected, ...remitted].map((r) => String(r._id))),
    ];
    return {
      period: "all-time",
      rows: ids.map((id) => {
        const c = collected.find((r) => r._id === id)?.collectedCents ?? 0,
          r = remitted.find((r) => r._id === id)?.remittedCents ?? 0;
        return {
          courierId: id,
          collectedCents: c,
          remittedCents: r,
          outstandingCents: c - r,
        };
      }),
      receipts,
    };
  }
  @Post(":id/void") async void(
    @CurrentUser() u: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: VoidReceiptDto,
  ) {
    if (!Types.ObjectId.isValid(id) || !dto.reason.trim())
      throw new BadRequestException("Enter a valid receipt and reason.");
    const receipt = await this.receipts
      .findOneAndUpdate(
        { _id: id, voidedAt: { $exists: false } },
        {
          $set: {
            voidedAt: new Date(),
            voidedBy: u.userId,
            voidReason: dto.reason.trim(),
          },
        },
        { new: true },
      )
      .exec();
    if (!receipt && !(await this.receipts.exists({ _id: id })))
      throw new BadRequestException("Receipt not found.");
    return { voided: true };
  }
  @Post() async record(
    @CurrentUser() u: JwtPayloadUser,
    @Body() dto: RemittanceDto,
  ) {
    if (!dto.reference.trim())
      throw new BadRequestException("Enter the bank or handover reference.");
    if (
      !(await this.users.exists({
        _id: dto.courierId,
        roles: UserRole.COURIER,
      }))
    )
      throw new BadRequestException("Courier not found.");
    const result = await this.receipts
      .findOneAndUpdate(
        { requestId: dto.requestId },
        {
          $setOnInsert: {
            ...dto,
            reference: dto.reference.trim(),
            recordedBy: u.userId,
          },
        },
        { upsert: true, new: true },
      )
      .exec()
      .catch(async (error: unknown) => {
        if ((error as { code?: number }).code !== 11000) throw error;
        return this.receipts
          .findOne({ requestId: dto.requestId })
          .orFail()
          .exec();
      });
    if (
      result.courierId !== dto.courierId ||
      result.amountCents !== dto.amountCents ||
      result.reference !== dto.reference.trim()
    )
      throw new ConflictException(
        "This receipt key was already used for different details.",
      );
    return result;
  }
}
@Controller("operations")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
class OperationsController {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(PushNotification.name)
    private readonly pushes: Model<PushNotificationDocument>,
  ) {}
  @Get("orders/:id") async timeline(@Param("id") id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException("Enter a valid order ID.");
    const order = await this.orders
      .findById(id)
      .select(
        "status paymentStatus refundStatus createdAt scheduledAt acceptedAt preparingAt readyAt pickedUpAt deliveredAt completedAt promisedDeliveryAt deliveryWindowStart deliveryWindowEnd offers compensationCents",
      )
      .lean()
      .exec();
    if (!order) throw new BadRequestException("Order not found.");
    return order;
  }
  @Get("notifications") async notifications() {
    return this.pushes
      .find({ deliveryStatus: { $in: ["queued", "sending", "failed"] } })
      .select("deliveryStatus attempts nextAttemptAt lastError createdAt")
      .sort({ createdAt: 1 })
      .limit(100)
      .lean()
      .exec();
  }
  @Post("notifications/:id/retry") async retry(@Param("id") id: string) {
    if (!Types.ObjectId.isValid(id))
      throw new BadRequestException("Notification not found.");
    return {
      queued: !!(await this.pushes
        .findOneAndUpdate(
          { _id: id, deliveryStatus: "failed" },
          {
            $set: {
              deliveryStatus: "queued",
              nextAttemptAt: new Date(),
              attempts: 0,
            },
          },
        )
        .exec()),
    };
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: DeliveryProof.name, schema: DeliveryProofSchema },
      { name: PushNotification.name, schema: PushNotificationSchema },
      { name: CashRemittance.name, schema: CashRemittanceSchema },
    ]),
  ],
  controllers: [AccessController, CashController, OperationsController],
})
export class OperationsModule {}

import { randomUUID } from "crypto";
import { RedisService } from "../redis/redis.service";
import { User, UserSchema } from "../account/schemas/user.schema";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  OnModuleInit,
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
import {
  IsBoolean,
  IsOptional,
  Matches,
  IsDateString,
  IsIn,
  IsInt,
  IsMongoId,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import {
  HydratedDocument,
  Model,
  Schema as MongoSchema,
  Types,
} from "mongoose";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrderStatus, PaymentStatus, UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
import {
  Provider,
  ProviderDocument,
  ProviderSchema,
} from "../providers/schemas/provider.schema";
import {
  DeliveryProof,
  DeliveryProofDocument,
  DeliveryProofSchema,
} from "../proof/schemas/delivery-proof.schema";

@Schema({ timestamps: true, collection: "partner_settlements" })
export class Settlement {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true })
  orderId!: Types.ObjectId;
  @Prop({ required: true }) party!: "provider" | "courier";
  @Prop({ type: MongoSchema.Types.ObjectId, required: true })
  payeeId!: Types.ObjectId;
  @Prop({ required: true, min: 0 }) amountCents!: number;
  @Prop({ required: true }) dueAt!: Date;
  @Prop({ required: true }) note!: string;
  @Prop({ default: "pending" }) status!:
    "pending" | "paid" | "transferring" | "transferred" | "transfer_review";
  @Prop({ default: false }) autoTransfer!: boolean;
  @Prop() payoutAccountId?: string;
  @Prop() transferStartedAt?: Date;
  @Prop() transferError?: string;
  @Prop() nextAttemptAt?: Date;
  @Prop({ type: MongoSchema.Types.ObjectId, required: true })
  createdBy!: Types.ObjectId;
  @Prop({ type: MongoSchema.Types.ObjectId }) paidBy?: Types.ObjectId;
  @Prop() paidAt?: Date;
  @Prop() paymentReference?: string;
}
const SettlementSchema = SchemaFactory.createForClass(Settlement);
SettlementSchema.index({ orderId: 1, party: 1 }, { unique: true });
type SettlementDocument = HydratedDocument<Settlement>;
export class RecordSettlementDto {
  @IsOptional() @IsBoolean() autoTransfer?: boolean;
  @IsMongoId() orderId!: string;
  @IsIn(["provider", "courier"]) party!: "provider" | "courier";
  @IsInt() @Min(0) @Max(10000000) amountCents!: number;
  @IsDateString() dueAt!: string;
  @IsString() @MinLength(5) @MaxLength(500) note!: string;
}
export class PaySettlementDto {
  @IsString() @MinLength(5) @MaxLength(100) paymentReference!: string;
}
export class BindPayoutAccountDto {
  @IsIn(["provider", "courier"]) party!: "provider" | "courier";
  @IsMongoId() payeeId!: string;
  @IsString() @Matches(/^acct_[a-zA-Z0-9]+$/) accountId!: string;
}
@Schema({ timestamps: true, collection: "partner_withdrawals" })
export class Withdrawal {
  @Prop({ type: MongoSchema.Types.ObjectId, required: true })
  payeeId!: Types.ObjectId;
  @Prop({ required: true }) party!: "provider" | "courier";
  @Prop({ required: true }) requestKey!: string;
  @Prop({ type: [MongoSchema.Types.ObjectId], required: true })
  settlementIds!: Types.ObjectId[];
  @Prop({ required: true }) amountCents!: number;
  @Prop({ required: true }) payoutDetails!: string;
  @Prop({ default: "pending" }) status!:
    "pending" | "approved" | "paying" | "paid" | "rejected";
  @Prop({ default: 0 }) revision!: number;
  @Prop() paymentReference?: string;
  @Prop() paidAt?: Date;
  @Prop({
    type: [
      { _id: false, actor: String, at: Date, status: String, note: String },
    ],
    default: [],
  })
  history!: Array<{ actor: string; at: Date; status: string; note: string }>;
}
const WithdrawalSchema = SchemaFactory.createForClass(Withdrawal);
WithdrawalSchema.index(
  { payeeId: 1, party: 1, requestKey: 1 },
  { unique: true },
);
WithdrawalSchema.index(
  { payeeId: 1, party: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "approved", "paying"] },
    },
  },
);
class RequestWithdrawalDto {
  @IsString() @MinLength(8) @MaxLength(100) requestKey!: string;
  @IsString() @MinLength(10) @MaxLength(500) payoutDetails!: string;
}
class ReviewWithdrawalDto {
  @IsInt() @Min(0) revision!: number;
  @IsIn(["approved", "rejected", "paid"]) status!:
    "approved" | "rejected" | "paid";
  @IsString() @MinLength(5) @MaxLength(500) note!: string;
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(100)
  paymentReference?: string;
}
@Injectable()
export class FinanceService implements OnModuleInit {
  constructor(
    @InjectModel(Settlement.name)
    private readonly settlements: Model<SettlementDocument>,
    @InjectModel(Withdrawal.name)
    private readonly withdrawals: Model<HydratedDocument<Withdrawal>>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    @InjectModel(Provider.name)
    private readonly providers: Model<ProviderDocument>,
    @InjectModel(DeliveryProof.name)
    private readonly proofs: Model<DeliveryProofDocument>,
    private readonly redis: RedisService,
  ) {}
  async bindAccount(_dto: BindPayoutAccountDto) {
    throw new BadRequestException(
      "Partner withdrawals are paid manually by platform administrators.",
    );
  }
  async transfer(_id: string) {
    throw new BadRequestException(
      "Automatic partner transfers are disabled. Review withdrawal requests instead.",
    );
  }
  async onModuleInit() {
    await Promise.all([this.settlements.init(), this.withdrawals.init()]);
  }
  private async partnerId(userId: string, party: "provider" | "courier") {
    if (party === "courier") return new Types.ObjectId(userId);
    const provider = await this.providers
      .findOne({ userId: new Types.ObjectId(userId) })
      .exec();
    if (!provider) throw new NotFoundException("Partner profile not found.");
    return provider._id as Types.ObjectId;
  }
  private async withPartnerLock<T>(
    payeeId: string,
    party: string,
    action: () => Promise<T>,
  ): Promise<T> {
    const key = `withdrawal:${party}:${payeeId}`;
    const owner = randomUUID();
    if (!(await this.redis.acquireLock(key, owner, 60000)))
      throw new ConflictException(
        "Another finance operation is in progress. Please retry.",
      );
    try {
      return await action();
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }
  async listWithdrawals(userId?: string, party?: "provider" | "courier") {
    const filter =
      userId && party
        ? { payeeId: await this.partnerId(userId, party), party }
        : {};
    const rows = await this.withdrawals
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean()
      .exec();
    return rows.map((row) =>
      userId
        ? {
            _id: row._id,
            amountCents: row.amountCents,
            status: row.status,
            createdAt: (row as typeof row & { createdAt: Date }).createdAt,
            paidAt: row.paidAt,
            paymentReference: row.paymentReference,
            payoutDetails: row.payoutDetails,
            history: row.history.map((h) => ({
              at: h.at,
              status: h.status,
              note: h.note,
            })),
          }
        : row,
    );
  }
  async requestWithdrawal(
    userId: string,
    party: "provider" | "courier",
    dto: RequestWithdrawalDto,
  ) {
    if (dto.payoutDetails.trim().length < 10)
      throw new BadRequestException("Enter valid bank payment details.");
    const payeeId = await this.partnerId(userId, party);
    return this.withPartnerLock(String(payeeId), party, async () => {
      const existing = await this.withdrawals
        .findOne({ payeeId, party, requestKey: dto.requestKey })
        .exec();
      if (existing && existing.payoutDetails !== dto.payoutDetails.trim())
        throw new ConflictException(
          "This request key was already used with different bank details.",
        );
      if (existing)
        return {
          id: existing.id,
          status: existing.status,
          amountCents: existing.amountCents,
        };
      if (
        await this.withdrawals.exists({
          payeeId,
          party,
          status: { $in: ["pending", "approved", "paying"] },
        })
      )
        throw new ConflictException("A withdrawal is already in progress.");
      const entries = await this.settlements
        .find({
          payeeId,
          party,
          status: "pending",
          autoTransfer: { $ne: true },
          dueAt: { $lte: new Date() },
        })
        .exec();
      const amountCents = entries.reduce(
        (sum, row) => sum + row.amountCents,
        0,
      );
      if (amountCents <= 0)
        throw new BadRequestException(
          "No approved, due balance is available for withdrawal.",
        );
      const row = await this.withdrawals.create({
        payeeId,
        party,
        requestKey: dto.requestKey,
        settlementIds: entries.map((e) => e._id),
        amountCents,
        payoutDetails: dto.payoutDetails.trim(),
        history: [
          {
            actor: userId,
            at: new Date(),
            status: "pending",
            note: "Withdrawal requested.",
          },
        ],
      });
      return { id: row.id, status: row.status, amountCents: row.amountCents };
    });
  }
  async reviewWithdrawal(id: string, actor: string, dto: ReviewWithdrawalDto) {
    if (dto.note.trim().length < 5)
      throw new BadRequestException("Enter a review note.");
    const existing = await this.withdrawals.findById(id).exec();
    if (!existing) throw new NotFoundException("Withdrawal not found.");
    return this.withPartnerLock(
      String(existing.payeeId),
      existing.party,
      async () => {
        const row = await this.withdrawals.findById(id).exec();
        if (!row) throw new NotFoundException("Withdrawal not found.");
        if (
          row.status === "paid" &&
          dto.status === "paid" &&
          row.paymentReference === dto.paymentReference?.trim()
        )
          return row;
        const recovering =
          row.status === "paying" &&
          dto.status === "paid" &&
          row.paymentReference === dto.paymentReference?.trim();
        if (!recovering && row.revision !== dto.revision)
          throw new ConflictException(
            "Withdrawal changed. Refresh before reviewing.",
          );
        if (
          (dto.status === "approved" && row.status !== "pending") ||
          (dto.status === "rejected" &&
            !["pending", "approved"].includes(row.status)) ||
          (dto.status === "paid" &&
            !["approved", "paying"].includes(row.status))
        )
          throw new ConflictException("Invalid withdrawal transition.");
        if (dto.status === "paid") {
          const reference = dto.paymentReference?.trim();
          if (!reference || reference.length < 5)
            throw new BadRequestException(
              "Record the actual external payment reference.",
            );
          if (row.status === "paying" && row.paymentReference !== reference)
            throw new ConflictException(
              "Recover the original recorded payment reference.",
            );
          if (row.status !== "paying") {
            const entries = await this.settlements
              .find({ _id: { $in: row.settlementIds } })
              .exec();
            if (
              entries.length !== row.settlementIds.length ||
              entries.some((e) => e.status !== "pending" || e.autoTransfer) ||
              entries.reduce((n, e) => n + e.amountCents, 0) !== row.amountCents
            )
              throw new ConflictException(
                "The reserved balance changed. Reconcile before payment.",
              );
            row.status = "paying";
            row.paymentReference = reference;
            row.revision += 1;
            row.history.push({
              actor,
              at: new Date(),
              status: "paying",
              note: dto.note.trim(),
            });
            await row.save();
          }
          await this.settlements
            .updateMany(
              {
                _id: { $in: row.settlementIds },
                status: "pending",
                autoTransfer: { $ne: true },
              },
              {
                $set: {
                  status: "paid",
                  paidBy: new Types.ObjectId(actor),
                  paidAt: new Date(),
                  paymentReference: reference,
                },
              },
            )
            .exec();
          if (
            (await this.settlements
              .countDocuments({
                _id: { $in: row.settlementIds },
                status: "paid",
                paymentReference: reference,
              })
              .exec()) !== row.settlementIds.length
          )
            throw new ConflictException(
              "Payment recording requires reconciliation.",
            );
          row.paidAt = new Date();
        }
        row.status = dto.status;
        row.revision += 1;
        row.history.push({
          actor,
          at: new Date(),
          status: dto.status,
          note: dto.note.trim(),
        });
        await row.save();
        return row;
      },
    );
  }
  async record(dto: RecordSettlementDto, actor: string) {
    const order = await this.orders.findById(dto.orderId).exec();
    if (
      !order ||
      order.isTestOrder ||
      order.status !== OrderStatus.COMPLETED ||
      order.paymentStatus !== PaymentStatus.CAPTURED
    )
      throw new BadRequestException("Choose a completed, non-test order.");
    const payeeId =
      dto.party === "provider" ? order.providerId : order.courierId;
    if (!payeeId || dto.note.trim().length < 5)
      throw new BadRequestException(
        "Order assignment and an accounting note are required.",
      );
    if (dto.autoTransfer)
      throw new BadRequestException(
        "Partner payments are manual. Automatic transfers are disabled.",
      );
    try {
      return await this.settlements.create({
        ...dto,
        autoTransfer: false,
        orderId: order._id,
        dueAt: new Date(dto.dueAt),
        note: dto.note.trim(),
        payeeId,
        createdBy: new Types.ObjectId(actor),
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000)
        throw new ConflictException(
          "A settlement already exists for this order and partner.",
        );
      throw error;
    }
  }
  async markPaid(id: string, actor: string, reference: string) {
    const target = await this.settlements.findById(id).exec();
    if (!target) throw new NotFoundException("Settlement not found.");
    return this.withPartnerLock(
      String(target.payeeId),
      target.party,
      async () => {
        if (
          await this.withdrawals.exists({
            settlementIds: target._id,
            status: { $in: ["pending", "approved", "paying"] },
          })
        )
          throw new ConflictException(
            "This amount is reserved in a withdrawal. Record payment on that request.",
          );
        if (reference.trim().length < 5)
          throw new BadRequestException(
            "Enter the actual bank transfer reference.",
          );
        const row = await this.settlements
          .findOneAndUpdate(
            { _id: id, status: "pending", autoTransfer: { $ne: true } },
            {
              $set: {
                status: "paid",
                paidBy: new Types.ObjectId(actor),
                paidAt: new Date(),
                paymentReference: reference.trim(),
              },
            },
            { new: true },
          )
          .exec();
        if (row) return row;
        const existing = await this.settlements.findById(id).exec();
        if (existing?.paymentReference === reference.trim()) return existing;
        throw new ConflictException(
          "Settlement changed or has already been paid.",
        );
      },
    );
  }

  async statement(userId: string, party: "provider" | "courier") {
    let payeeId = new Types.ObjectId(userId);
    if (party === "provider") {
      const provider = await this.providers.findOne({ userId: payeeId }).exec();
      if (!provider) throw new NotFoundException("Partner profile not found.");
      payeeId = provider._id as Types.ObjectId;
    }
    const rows = await this.settlements
      .find({ payeeId, party })
      .sort({ createdAt: -1 })
      .limit(200)
      .exec();
    const entries = rows.map((row) => ({
      id: row.id,
      orderId: String(row.orderId),
      amountCents: row.amountCents,
      dueAt: row.dueAt,
      status: row.status,
      paidAt: row.paidAt,
      paymentReference: row.paymentReference,
    }));
    const [summary] = await this.settlements.aggregate([
      { $match: { payeeId, party } },
      {
        $group: {
          _id: null,
          dueCents: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "pending"] },
                    { $ne: ["$autoTransfer", true] },
                    { $lte: ["$dueAt", new Date()] },
                  ],
                },
                "$amountCents",
                0,
              ],
            },
          },
          pendingCents: {
            $sum: {
              $cond: [
                {
                  $in: [
                    "$status",
                    ["pending", "transferring", "transfer_review"],
                  ],
                },
                "$amountCents",
                0,
              ],
            },
          },
          transferredCents: {
            $sum: {
              $cond: [{ $eq: ["$status", "transferred"] }, "$amountCents", 0],
            },
          },
          paidCents: {
            $sum: { $cond: [{ $eq: ["$status", "paid"] }, "$amountCents", 0] },
          },
        },
      },
    ]);
    const activeWithdrawal = await this.withdrawals
      .findOne({
        payeeId,
        party,
        status: { $in: ["pending", "approved", "paying"] },
      })
      .exec();
    return {
      entries,
      withdrawableCents: activeWithdrawal ? 0 : (summary?.dueCents ?? 0),
      reservedCents: activeWithdrawal?.amountCents ?? 0,
      pendingCents: summary?.pendingCents ?? 0,
      paidCents: summary?.paidCents ?? 0,
      transferredCents: summary?.transferredCents ?? 0,
    };
  }
  async overview() {
    const [entries, completed, cash] = await Promise.all([
      this.settlements.find().sort({ createdAt: -1 }).limit(200).exec(),
      this.orders
        .find({
          status: OrderStatus.COMPLETED,
          isTestOrder: { $ne: true },
          createdAt: { $gte: new Date(Date.now() - 30 * 86400000) },
        })
        .select(
          "totalCents compensationCents providerId courierId completedAt paymentMethod deliveryZipcode",
        )
        .sort({ completedAt: -1 })
        .limit(1000)
        .exec(),
      this.proofs.aggregate([
        {
          $match: {
            cashReceiptAt: { $gte: new Date(Date.now() - 30 * 86400000) },
          },
        },
        {
          $group: {
            _id: "$courierId",
            collectedCents: { $sum: "$cashReceiptAmountCents" },
            receipts: { $sum: 1 },
          },
        },
      ]),
    ]);
    return {
      entries,
      completed,
      cash,
      periodDays: 30,
      autoTransfersConfigured: false,
    };
  }
}
@Controller("finance")
@UseGuards(JwtAuthGuard, RolesGuard)
class FinanceController {
  constructor(private readonly finance: FinanceService) {}
  @Get("admin/withdrawals")
  @Roles(UserRole.ADMIN)
  withdrawals() {
    return this.finance.listWithdrawals();
  }
  @Post("admin/withdrawals/:id/review")
  @Roles(UserRole.ADMIN)
  reviewWithdrawal(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: ReviewWithdrawalDto,
  ) {
    return this.finance.reviewWithdrawal(id, user.userId, dto);
  }
  @Get("provider/withdrawals")
  @Roles(UserRole.PROVIDER)
  providerWithdrawals(@CurrentUser() user: JwtPayloadUser) {
    return this.finance.listWithdrawals(user.userId, "provider");
  }
  @Post("provider/withdrawals")
  @Roles(UserRole.PROVIDER)
  requestProviderWithdrawal(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.finance.requestWithdrawal(user.userId, "provider", dto);
  }
  @Get("courier/withdrawals")
  @Roles(UserRole.COURIER)
  courierWithdrawals(@CurrentUser() user: JwtPayloadUser) {
    return this.finance.listWithdrawals(user.userId, "courier");
  }
  @Post("courier/withdrawals")
  @Roles(UserRole.COURIER)
  requestCourierWithdrawal(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: RequestWithdrawalDto,
  ) {
    return this.finance.requestWithdrawal(user.userId, "courier", dto);
  }
  @Post("admin/payout-accounts")
  @Roles(UserRole.ADMIN)
  bind(@Body() dto: BindPayoutAccountDto) {
    return this.finance.bindAccount(dto);
  }
  @Post("admin/settlements/:id/reconcile")
  @Roles(UserRole.ADMIN)
  reconcile(@Param("id") id: string) {
    return this.finance.transfer(id);
  }
  @Get("admin") @Roles(UserRole.ADMIN) overview() {
    return this.finance.overview();
  }
  @Post("admin/settlements") @Roles(UserRole.ADMIN) record(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: RecordSettlementDto,
  ) {
    return this.finance.record(dto, user.userId);
  }
  @Post("admin/settlements/:id/paid") @Roles(UserRole.ADMIN) paid(
    @CurrentUser() user: JwtPayloadUser,
    @Param("id") id: string,
    @Body() dto: PaySettlementDto,
  ) {
    return this.finance.markPaid(id, user.userId, dto.paymentReference);
  }
  @Get("provider") @Roles(UserRole.PROVIDER) provider(
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.finance.statement(user.userId, "provider");
  }
  @Get("courier") @Roles(UserRole.COURIER) courier(
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.finance.statement(user.userId, "courier");
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Settlement.name, schema: SettlementSchema },
      { name: Withdrawal.name, schema: WithdrawalSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Provider.name, schema: ProviderSchema },
      { name: DeliveryProof.name, schema: DeliveryProofSchema },
    ]),
  ],
  controllers: [FinanceController],
  providers: [FinanceService],
})
export class FinanceModule {}

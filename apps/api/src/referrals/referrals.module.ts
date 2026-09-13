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
  Patch,
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
import { IsInt, IsString, Matches, Max, Min } from "class-validator";
import { randomBytes } from "crypto";
import { Model, Types, HydratedDocument } from "mongoose";
import { User, UserDocument, UserSchema } from "../account/schemas/user.schema";
import {
  Order,
  OrderDocument,
  OrderSchema,
} from "../orders/schemas/order.schema";
import { AppConfigService } from "../app-config/app-config.service";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { OrderStatus, PaymentStatus, UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { WalletModule, WalletService } from "../wallet/wallet.module";
@Schema({ timestamps: true, collection: "referrals" })
class Referral {
  @Prop({ required: true, unique: true }) inviteeId!: string;
  @Prop({ required: true, index: true }) inviterId!: string;
  @Prop({ required: true }) rewardCents!: number;
  @Prop({ default: "pending" }) status!: string;
  @Prop() orderId?: string;
  @Prop() approvedBy?: string;
  @Prop() approvedAt?: Date;
}
type ReferralDocument = HydratedDocument<Referral>;
const ReferralSchema = SchemaFactory.createForClass(Referral);
class ApplyReferralDto {
  @IsString() @Matches(/^[a-f0-9]{16}$/) code!: string;
}
class ReferralSettingsDto {
  @IsInt() @Min(0) @Max(10000) rewardCents!: number;
}
@Injectable()
export class ReferralsService implements OnModuleInit {
  constructor(
    @InjectModel(Referral.name)
    private readonly referrals: Model<ReferralDocument>,
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly config: AppConfigService,
    private readonly wallet: WalletService,
  ) {}
  async onModuleInit() {
    await this.referrals.init();
  }
  async mine(userId: string) {
    let user = await this.users.findById(userId).exec();
    if (!user) throw new NotFoundException("Account not found.");
    if (!user.referralCode) {
      await this.users
        .updateOne(
          { _id: userId, referralCode: { $exists: false } },
          { $set: { referralCode: randomBytes(8).toString("hex") } },
        )
        .exec();
      user = await this.users.findById(userId).orFail().exec();
    }
    const [pending, rewarded, own, settings] = await Promise.all([
      this.referrals.countDocuments({
        inviterId: userId,
        status: { $ne: "rewarded" },
      }),
      this.referrals.countDocuments({ inviterId: userId, status: "rewarded" }),
      this.referrals.findOne({ inviteeId: userId }).lean(),
      this.settings(),
    ]);
    return {
      code: user.referralCode,
      pending,
      rewarded,
      applied: Boolean(own),
      ownStatus: own?.status,
      rewardCents: settings.rewardCents,
      agreedRewardCents: own?.rewardCents,
    };
  }
  async settings() {
    return { rewardCents: (await this.config.get()).referralRewardCents ?? 0 };
  }
  async configure(dto: ReferralSettingsDto) {
    await this.config.update({ referralRewardCents: dto.rewardCents });
    return this.settings();
  }
  async apply(userId: string, dto: ApplyReferralDto) {
    const existing = await this.referrals.findOne({ inviteeId: userId }).exec();
    const inviter = await this.users
      .findOne({
        referralCode: dto.code,
        isActive: true,
        roles: UserRole.CUSTOMER,
      })
      .exec();
    if (!inviter || inviter.id === userId)
      throw new BadRequestException(
        "Choose a valid code from another customer.",
      );
    if (existing) {
      if (existing.inviterId === inviter.id) return { applied: true };
      throw new ConflictException(
        "A referral code is already attached to this account.",
      );
    }
    if (
      await this.orders.exists({
        customerId: new Types.ObjectId(userId),
        paymentStatus: {
          $in: [
            PaymentStatus.CAPTURED,
            PaymentStatus.AUTHORIZED,
            PaymentStatus.REFUNDED,
          ],
        },
        isTestOrder: { $ne: true },
      })
    )
      throw new BadRequestException(
        "Apply a referral before your first paid order.",
      );
    const { rewardCents } = await this.settings();
    if (!rewardCents)
      throw new BadRequestException(
        "Referral rewards are not currently active.",
      );
    try {
      await this.referrals.create({
        inviteeId: userId,
        inviterId: inviter.id,
        rewardCents,
      });
    } catch (e) {
      if ((e as { code?: number }).code === 11000)
        throw new ConflictException(
          "Referral already applied. Refresh your account.",
        );
      throw e;
    }
    return { applied: true };
  }
  private qualifyingOrder(inviteeId: string) {
    return this.orders
      .findOne({
        customerId: new Types.ObjectId(inviteeId),
        isTestOrder: { $ne: true },
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.CAPTURED,
        totalCents: { $gte: 1000 },
      })
      .sort({ completedAt: 1, _id: 1 })
      .exec();
  }
  async queue(): Promise<Array<Referral & { _id: string; eligible: boolean }>> {
    const rows = await this.referrals
      .find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean()
      .exec();
    return Promise.all(
      rows.map(async (row) => ({
        _id: String(row._id),
        inviteeId: row.inviteeId,
        inviterId: row.inviterId,
        rewardCents: row.rewardCents,
        status: row.status,
        orderId: row.orderId,
        approvedBy: row.approvedBy,
        approvedAt: row.approvedAt,
        eligible: Boolean(await this.qualifyingOrder(row.inviteeId)),
      })),
    );
  }
  async approve(id: string, adminId: string) {
    if (!Types.ObjectId.isValid(id))
      throw new NotFoundException("Referral not found.");
    const row = await this.referrals.findById(id).exec();
    if (!row) throw new NotFoundException("Referral not found.");
    if (row.status === "rewarded") return { rewarded: true };
    const order = await this.qualifyingOrder(row.inviteeId);
    if (!order)
      throw new BadRequestException(
        "A completed paid order of at least €10 is required.",
      );
    const reserved = await this.referrals
      .findOneAndUpdate(
        { _id: id, status: "pending" },
        {
          $set: {
            status: "approving",
            orderId: order.id,
            approvedBy: adminId,
            approvedAt: new Date(),
          },
        },
        { new: true },
      )
      .exec();
    const active =
      reserved ?? (await this.referrals.findById(id).orFail().exec());
    // Each side has a permanent receipt: retrying an interrupted approval completes it without paying twice.
    await this.wallet.change(
      active.inviteeId,
      `referral:${id}:invitee`,
      active.rewardCents,
      active.orderId!,
    );
    await this.wallet.change(
      active.inviterId,
      `referral:${id}:inviter`,
      active.rewardCents,
      active.orderId!,
    );
    await this.referrals
      .updateOne({ _id: id }, { $set: { status: "rewarded" } })
      .exec();
    return { rewarded: true };
  }
}
@Controller("referrals")
@UseGuards(JwtAuthGuard, RolesGuard)
class ReferralsController {
  constructor(private readonly service: ReferralsService) {}
  @Get("me") @Roles(UserRole.CUSTOMER) mine(
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.service.mine(user.userId);
  }
  @Post("apply") @Roles(UserRole.CUSTOMER) apply(
    @CurrentUser() user: JwtPayloadUser,
    @Body() dto: ApplyReferralDto,
  ) {
    return this.service.apply(user.userId, dto);
  }
  @Get("admin") @Roles(UserRole.ADMIN) queue() {
    return this.service.queue();
  }
  @Get("admin/settings") @Roles(UserRole.ADMIN) settings() {
    return this.service.settings();
  }
  @Patch("admin/settings") @Roles(UserRole.ADMIN) settingsUpdate(
    @Body() dto: ReferralSettingsDto,
  ) {
    return this.service.configure(dto);
  }
  @Post("admin/:id/approve") @Roles(UserRole.ADMIN) approve(
    @Param("id") id: string,
    @CurrentUser() user: JwtPayloadUser,
  ) {
    return this.service.approve(id, user.userId);
  }
}
@Module({
  imports: [
    WalletModule,
    MongooseModule.forFeature([
      { name: Referral.name, schema: ReferralSchema },
      { name: User.name, schema: UserSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
  ],
  providers: [ReferralsService],
  controllers: [ReferralsController],
})
export class ReferralsModule {}

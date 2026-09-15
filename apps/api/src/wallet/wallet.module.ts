import {
  BadRequestException,
  Controller,
  Get,
  Injectable,
  Module,
  NotFoundException,
  UseGuards,
} from "@nestjs/common";
import { InjectModel, MongooseModule } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { User, UserDocument, UserSchema } from "../account/schemas/user.schema";
import {
  CurrentUser,
  type JwtPayloadUser,
} from "../common/decorators/current-user.decorator";
import { Roles } from "../common/decorators/roles.decorator";
import { UserRole } from "../common/enums";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
@Injectable()
export class WalletService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
  ) {}
  async change(
    userId: string,
    key: string,
    amountCents: number,
    orderId: string,
  ) {
    if (!Number.isSafeInteger(amountCents) || amountCents === 0)
      throw new BadRequestException("Invalid credit amount.");
    // Balance and idempotency receipt change in a single document write.
    const updated = await this.users
      .findOneAndUpdate(
        {
          _id: userId,
          "creditEntries.key": { $ne: key },
          ...(amountCents < 0 ? { creditCents: { $gte: -amountCents } } : {}),
        },
        {
          $inc: { creditCents: amountCents },
          $push: {
            creditEntries: { key, orderId, amountCents, at: new Date() },
          },
        },
        { new: true },
      )
      .exec();
    if (updated) return updated.creditCents;
    const user = await this.users.findById(userId).exec();
    if (!user) throw new NotFoundException("Account not found.");
    const previous = user.creditEntries?.find((entry) => entry.key === key);
    if (
      previous &&
      previous.amountCents === amountCents &&
      previous.orderId === orderId
    )
      return user.creditCents;
    throw new BadRequestException(
      "Your Yespizz credit does not cover this order. Choose another payment method.",
    );
  }
  async refundPurchase(userId: string, orderId: string) {
    const user = await this.users.findById(userId).exec();
    const debit = user?.creditEntries?.find(
      (entry) => entry.key === `payment:${orderId}`,
    );
    if (debit && debit.amountCents < 0)
      await this.change(
        userId,
        `refund:${orderId}`,
        -debit.amountCents,
        orderId,
      );
  }
  async statement(userId: string) {
    const user = await this.users.findById(userId).exec();
    if (!user) throw new NotFoundException("Account not found.");
    return {
      balanceCents: user.creditCents ?? 0,
      entries: (user.creditEntries ?? [])
        .slice(-100)
        .reverse()
        .map((entry) => ({
          orderId: entry.key.startsWith("referral:") ? "" : entry.orderId,
          amountCents: entry.amountCents,
          at: entry.at,
          kind: entry.key.startsWith("loyalty:")
            ? "loyalty"
            : entry.key.startsWith("referral:")
              ? "referral"
              : entry.key.startsWith("sla:")
                ? "compensation"
                : entry.key.startsWith("refund:")
                  ? "refund"
                  : "purchase",
        })),
    };
  }
}
@Controller("wallet")
@UseGuards(JwtAuthGuard, RolesGuard)
class WalletController {
  constructor(private readonly wallet: WalletService) {}
  @Get()
  @Roles(UserRole.CUSTOMER)
  get(@CurrentUser() user: JwtPayloadUser) {
    return this.wallet.statement(user.userId);
  }
}
@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}

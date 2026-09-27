import { BillingService } from "../billing/billing.service";
import { RewardPolicyService, DEFAULT_REWARD_POLICY } from "./policy.module";
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { User, UserDocument } from "../account/schemas/user.schema";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { OrderStatus, PaymentStatus } from "../common/enums";
import { WalletService } from "../wallet/wallet.module";

export const LOYALTY_RULES = {
  ordersPerReward: 5,
  rewardCents: 500,
  minimumOrderCents: 1000,
};
export const MEMBERSHIP_PLAN = {
  priceCents: 499,
  days: 30,
  minimumSubtotalCents: 1500,
};

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly wallet: WalletService,
    private readonly policies: RewardPolicyService,
    private readonly billing: BillingService,
  ) {}

  async summary(userId: string) {
    const [user, policy, groups] = await Promise.all([
      this.users.findById(userId).exec(),
      this.policies.current(),
      this.orders.aggregate([
        {
          $match: {
            customerId: new Types.ObjectId(userId),
            status: { $in: [OrderStatus.COMPLETED, OrderStatus.DELIVERED] },
            paymentStatus: PaymentStatus.CAPTURED,
            isTestOrder: { $ne: true },
          },
        },
        {
          $set: {
            policy: { $ifNull: ["$loyaltyPolicy", DEFAULT_REWARD_POLICY] },
          },
        },
        {
          $match: {
            $expr: { $gte: ["$totalCents", "$policy.minimumOrderCents"] },
          },
        },
        { $group: { _id: "$policy", completed: { $sum: 1 } } },
      ]),
    ]);
    if (!user) throw new NotFoundException("Account not found.");
    // Rewards are derived exclusively from fulfilled, paid orders.
    const mock = false;
    const campaigns = groups
      .map(
        (group: { _id: typeof DEFAULT_REWARD_POLICY; completed: number }) => {
          const claimed = (user.creditEntries ?? []).filter((e) =>
            e.key.startsWith(`loyalty:v${group._id.version}:`),
          ).length;
          return {
            ...group._id,
            completed: group.completed,
            claimed,
            available: Math.max(
              0,
              Math.floor(group.completed / group._id.ordersPerReward) - claimed,
            ),
            progress: group.completed % group._id.ordersPerReward,
          };
        },
      )
      .sort((a, b) => a.version - b.version);
    const current = campaigns.find((c) => c.version === policy.version);
    const completed = current?.completed ?? 0,
      claimed = current?.claimed ?? 0;
    const ready = campaigns.find((c) => c.available > 0);
    return {
      mock,
      rules: policy,
      campaigns,
      nextRewardCents: ready?.rewardCents ?? policy.rewardCents,
      completed,
      claimed,
      available: campaigns.reduce((n, c) => n + c.available, 0),
      progress: current?.progress ?? 0,
      balanceCents: user.creditCents ?? 0,
      membership: {
        ...MEMBERSHIP_PLAN,
        active:
          !!user.membershipUntil && user.membershipUntil.getTime() > Date.now(),
        until: user.membershipUntil ?? null,
        cancelled: user.membershipCancelled ?? false,
        mock: false,
        status: user.membershipStatus ?? null,
        canManage: !!user.membershipSubscriptionId,
        canEnroll: this.billing.enabled(),
      },
    };
  }

  async claim(userId: string) {
    const summary = await this.summary(userId);
    if (summary.available === 0)
      throw new BadRequestException("No reward is ready yet.");
    const campaign = summary.campaigns.find((c) => c.available > 0)!;
    // A deterministic receipt preserves each order's original reward terms.
    await this.wallet.change(
      userId,
      `loyalty:v${campaign.version}:${campaign.claimed + 1}`,
      campaign.rewardCents,
      "",
    );
    return this.summary(userId);
  }
}

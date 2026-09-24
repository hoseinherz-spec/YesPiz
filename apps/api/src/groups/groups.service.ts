import { Cron } from "@nestjs/schedule";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { randomBytes, randomUUID } from "crypto";
import { GroupCart, GroupCartDocument } from "./group.schema";
import {
  CreateGroupDto,
  GroupContributionDto,
  GroupLockDto,
  GroupSubmitDto,
} from "./group.dto";
import { CatalogService } from "../catalog/catalog.service";
import { OrdersService } from "../orders/orders.service";
import { PaymentsService } from "../payments/payments.service";
import { AccountService } from "../account/account.service";
import { RedisService } from "../redis/redis.service";
import { PaymentMethod } from "../common/enums";
export function splitGroupTotal(total: number, counts: number[]) {
  const units = counts.reduce((a, b) => a + b, 0);
  if (!units) return counts.map(() => 0);
  const shares = counts.map((count) => Math.floor((total * count) / units));
  let remainder = total - shares.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % shares.length)
    if (counts[i] > 0) {
      shares[i]++;
      remainder--;
    }
  return shares;
}
@Injectable()
export class GroupsService {
  constructor(
    @InjectModel(GroupCart.name)
    private readonly groups: Model<GroupCartDocument>,
    private readonly orders: OrdersService,
    private readonly catalog: CatalogService,
    private readonly payments: PaymentsService,
    private readonly accounts: AccountService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}
  private async get(token: string) {
    if (!/^[a-f0-9]{32}$/.test(token))
      throw new NotFoundException("Group not found.");
    const group = await this.groups.findOne({ token }).exec();
    if (!group) throw new NotFoundException("Group not found.");
    return group;
  }
  private view(g: GroupCartDocument, userId: string) {
    return {
      token: g.token,
      title: g.title,
      menuVersion: g.menuVersion,
      split: g.split,
      state: g.state,
      revision: g.revision,
      mock: this.payments.isMockGateway(),
      refundPending: g.state === "cancelling",
      deadline: g.deadline,
      expired: g.deadline.getTime() <= Date.now(),
      owner: g.ownerId === userId,
      orderId: g.ownerId === userId ? g.orderId : undefined,
      quote: g.quote
        ? {
            totalCents: g.quote.totalCents,
            deliveryFeeCents: g.quote.deliveryFeeCents,
            subtotalCents: g.quote.subtotalCents,
          }
        : null,
      members: g.members.map((m) => ({
        name: m.name,
        mine: m.userId === userId,
        quantity: m.lines.reduce((n, l) => n + l.quantity, 0),
        paid: m.paid,
        shareCents: m.shareCents,
        picks: m.lines.map((l) => ({
          menuItemId: l.menuItemId,
          secondHalfItemId: l.secondHalfItemId,
          quantity: l.quantity,
          size: l.size ?? "medium",
        })),
      })),
    };
  }
  async list(userId: string) {
    return (
      await this.groups
        .find({ $or: [{ ownerId: userId }, { "members.userId": userId }] })
        .sort({ createdAt: -1 })
        .limit(20)
        .exec()
    ).map((g) => this.view(g, userId));
  }
  async read(userId: string, token: string) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      if (g.state === "locked") await this.syncShares(g);
      return this.view(g, userId);
    });
  }
  async create(userId: string, dto: CreateGroupDto) {
    const deadline = new Date(dto.deadline);
    const remaining = deadline.getTime() - Date.now();
    if (remaining < 60000 || remaining > 86400000 || !dto.title.trim())
      throw new BadRequestException(
        "Choose a title and a deadline within 24 hours.",
      );

    return this.view(
      await this.groups.create({
        ...dto,
        title: dto.title.trim(),
        ownerId: userId,
        token: randomBytes(16).toString("hex"),
        deadline,
      }),
      userId,
    );
  }
  private async exclusive<T>(token: string, work: () => Promise<T>) {
    const key = `group:${token}`,
      owner = randomUUID();
    if (!(await this.redis.acquireLock(key, owner, 120000)))
      throw new ConflictException("Group is updating. Please refresh.");
    try {
      return await work();
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }
  async contribute(userId: string, token: string, dto: GroupContributionDto) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      if (g.state !== "open" || g.deadline.getTime() <= Date.now())
        throw new BadRequestException(
          "This group is no longer accepting changes.",
        );
      if (g.revision !== dto.revision)
        throw new ConflictException(
          "Someone updated the group. Refresh and try again.",
        );
      const user = await this.accounts.findById(userId);
      if (!user) throw new ForbiddenException();
      const members = g.members.filter((m) => m.userId !== userId);
      if (members.length >= 20)
        throw new BadRequestException(
          "This group has reached its participant limit.",
        );
      if (dto.lines.length)
        members.push({
          userId,
          name: user.firstName?.trim().slice(0, 30) || "Guest",
          lines: dto.lines,
          paid: false,
          shareCents: 0,
        });
      if (members.flatMap((m) => m.lines).length > 50)
        throw new BadRequestException("This group has too many selections.");
      g.members = members;
      g.revision++;
      await g.save();
      return this.view(g, userId);
    });
  }
  async lock(userId: string, token: string, dto: GroupLockDto) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      this.owner(g, userId, dto.revision);
      if (g.state !== "open" || !g.members.length)
        throw new BadRequestException("Add pizzas before reviewing the group.");
      const checkout = {
        addressId: dto.addressId,
        menuVersion: g.menuVersion,
        paymentMethod: PaymentMethod.CARD,
        lines: g.members.flatMap((m) => m.lines),
      };
      const quote = await this.orders.quote(userId, checkout);
      // Allocate actual item totals, with fee/discount remainder assigned deterministically.
      let index = 0;
      const weights = g.members.map((m) =>
        m.lines.reduce((sum, l) => {
          const line = (quote.lines as Array<{ unitPriceCents: number }>)[
            index++
          ];
          return sum + Number(line.unitPriceCents) * l.quantity;
        }, 0),
      );
      const shares = splitGroupTotal(quote.totalCents, weights);
      g.members = g.members.map((m, i) => ({
        ...m,
        shareCents: shares[i],
        paid: false,
      }));
      g.checkout = checkout;
      g.quote = quote;
      if (
        !this.payments.isMockGateway() &&
        shares.some((amount) => amount < 50)
      )
        throw new BadRequestException(
          "Each card share must be at least €0.50.",
        );
      g.paymentRound = (g.paymentRound ?? 0) + 1;
      g.deadline = new Date(Date.now() + 30 * 60000);
      g.state = "locked";
      g.revision++;
      await g.save();
      return this.view(g, userId);
    });
  }
  private owner(g: GroupCartDocument, userId: string, revision: number) {
    if (g.ownerId !== userId) throw new ForbiddenException();
    if (g.revision !== revision)
      throw new ConflictException("Group changed. Please refresh.");
  }
  async payShare(userId: string, token: string) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      if (
        g.state !== "locked" ||
        g.deadline.getTime() <= Date.now() ||
        !g.split
      )
        throw new BadRequestException("The group must be reviewed first.");
      const member = g.members.find((m) => m.userId === userId);
      if (!member) throw new ForbiddenException();
      if (!this.payments.isMockGateway()) {
        await this.syncShares(g);
        const current = g.members.find((m) => m.userId === userId)!;
        if (current.paid) return this.view(g, userId);
        if (!current.checkoutId) {
          const session = await this.payments.createGroupCheckout(
            g.token,
            g.paymentRound,
            userId,
            current.shareCents,
          );
          current.checkoutId = session.id;
          g.markModified("members");
          await g.save();
        }
        const state = await this.payments.groupCheckoutState(
          current.checkoutId,
          g.token,
          g.paymentRound,
          userId,
          current.shareCents,
        );
        if (!state.checkoutUrl)
          throw new BadRequestException(
            "Checkout expired. Cancel and reopen the group to try again.",
          );
        return { ...this.view(g, userId), checkoutUrl: state.checkoutUrl };
      }
      if (!member.paid) {
        g.members = g.members.map((m) =>
          m.userId === userId ? { ...m, paid: true } : m,
        );
        g.revision++;
        await g.save();
      }
      return this.view(g, userId);
    });
  }
  async reopen(userId: string, token: string, revision: number) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      this.owner(g, userId, revision);
      if (g.state !== "locked" || g.orderId)
        throw new BadRequestException(
          "This group cannot be reopened after checkout has begun.",
        );
      if (g.members.some((m) => !!m.checkoutId))
        throw new BadRequestException(
          "Cancel this group to refund its payments before making changes.",
        );
      const current = await this.catalog.getPublishedVersionNumber();
      if (!current)
        throw new BadRequestException("The menu is temporarily unavailable.");
      if (current !== g.menuVersion) {
        g.menuVersion = current;
        g.members = [];
      }
      g.state = "open";
      g.checkout = undefined;
      g.quote = undefined;
      g.deadline = new Date(Date.now() + 30 * 60000);
      g.members = g.members.map((m) => ({ ...m, paid: false, shareCents: 0 }));
      g.revision++;
      await g.save();
      return this.view(g, userId);
    });
  }
  async cancel(userId: string, token: string, revision: number) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      this.owner(g, userId, revision);
      if (g.state === "ordered" || g.orderId)
        throw new BadRequestException(
          "Manage the placed order from order history.",
        );
      g.state = g.members.some((m) => !!m.checkoutId)
        ? "cancelling"
        : "cancelled";
      await g.save();
      if (g.state === "cancelling") await this.refundShares(g);
      else g.members = g.members.map((m) => ({ ...m, paid: false }));
      g.revision++;
      await g.save();
      return this.view(g, userId);
    });
  }
  async refundQueue() {
    return this.groups
      .find({ state: "cancelling" })
      .select("token title state refundError updatedAt")
      .sort({ updatedAt: 1 })
      .limit(100)
      .lean()
      .exec();
  }
  async retryRefund(token: string) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      if (g.state !== "cancelling" || g.orderId)
        throw new BadRequestException("No unplaced group refund is pending.");
      await this.refundShares(g);
      return { state: g.state, refundError: g.refundError };
    });
  }
  private async syncShares(g: GroupCartDocument) {
    if (this.payments.isMockGateway()) return;
    let changed = false;
    for (const m of g.members) {
      if (!m.checkoutId) continue;
      const state = await this.payments.groupCheckoutState(
        m.checkoutId,
        g.token,
        g.paymentRound,
        m.userId,
        m.shareCents,
      );
      if (m.paid !== state.paid || m.intentId !== state.intentId) {
        m.paid = state.paid;
        m.intentId = state.intentId;
        changed = true;
      }
    }
    if (changed) {
      g.markModified("members");
      await g.save();
    }
  }
  private async refundShares(g: GroupCartDocument) {
    let complete = true;
    try {
      for (const m of g.members)
        if (m.checkoutId)
          complete =
            (await this.payments.refundGroupShare(
              m.checkoutId,
              g.token,
              g.paymentRound,
              m.userId,
              m.shareCents,
            )) && complete;
      g.refundError = undefined;
    } catch {
      complete = false;
      g.refundError =
        "Refund reconciliation pending; operations must review persistent failures.";
    }
    if (complete) {
      g.state = "cancelled";
      g.members = g.members.map((m) => ({ ...m, paid: false }));
    }
    await g.save();
  }
  @Cron("*/30 * * * * *")
  async reconcileGroups() {
    const interrupted = await this.groups
      .find({ state: "locked", orderId: { $exists: true } })
      .limit(100)
      .exec();
    for (const g of interrupted) {
      try {
        await this.submit(g.ownerId, g.token, {
          revision: g.revision,
          expectedTotalCents: Number(g.quote?.totalCents),
        });
      } catch {
        /* A persisted order cannot be refunded as an unplaced group. Retry settlement. */
      }
    }
    const rows = await this.groups
      .find({
        $or: [
          { state: "cancelling" },
          { state: "locked", deadline: { $lte: new Date() } },
        ],
      })
      .limit(100)
      .exec();
    for (const row of rows) {
      try {
        await this.exclusive(row.token, async () => {
          const g = await this.get(row.token);
          if (g.orderId || !["locked", "cancelling"].includes(g.state)) return;
          g.state = "cancelling";
          await g.save();
          await this.refundShares(g);
        });
      } catch {
        /* The persisted state is retried on the next sweep. */
      }
    }
  }
  async submit(userId: string, token: string, dto: GroupSubmitDto) {
    return this.exclusive(token, async () => {
      const g = await this.get(token);
      if (g.ownerId !== userId) throw new ForbiddenException();
      if (g.state === "ordered") return this.view(g, userId);
      this.owner(g, userId, dto.revision);
      if (
        g.state !== "locked" ||
        !g.checkout ||
        Number(g.quote?.totalCents) !== dto.expectedTotalCents
      )
        throw new BadRequestException("Review the group total first.");
      await this.syncShares(g);
      if (g.split && g.members.some((m) => !m.paid))
        throw new BadRequestException(
          "Waiting for everyone to confirm their share.",
        );
      if (g.deadline.getTime() <= Date.now() && !g.orderId)
        throw new BadRequestException(
          "Group payment deadline passed. Cancel the group for a refund.",
        );
      const order = await this.orders.createOrder(userId, {
        ...g.checkout,
        idempotencyKey: `group:${g.token}:${g.paymentRound}`,
        expectedTotalCents: dto.expectedTotalCents,
      });
      g.orderId = String(order.id);
      await g.save();
      if (!this.payments.isMockGateway() && g.split) {
        await this.payments.captureGroupOrder(
          userId,
          g.orderId,
          g.token,
          g.paymentRound,
          g.members.map((m) => ({
            userId: m.userId,
            amountCents: m.shareCents,
            intentId: m.intentId!,
          })),
        );
      } else if (this.payments.isMockGateway()) {
        await this.payments.initiate(userId, {
          orderId: g.orderId,
          method: PaymentMethod.CARD,
        });
      }
      // Owner-paid groups continue through the ordinary authenticated checkout.

      g.state = "ordered";
      g.revision++;
      await g.save();
      return this.view(g, userId);
    });
  }
}

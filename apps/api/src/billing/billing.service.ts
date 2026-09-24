import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model } from "mongoose";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { User, UserDocument } from "../account/schemas/user.schema";
import { RedisService } from "../redis/redis.service";

/** Entitlements are based on paid invoices, never on the browser return URL. */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly stripe: Stripe | null;
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    private readonly config: ConfigService,
    private readonly redis: RedisService,
  ) {
    const key = config.get<string>("STRIPE_SECRET_KEY");
    const mode = config.get<string>("STRIPE_MODE");
    if (mode === "sandbox" && (!key || !/^(sk|rk|rkcs)_test_/.test(key)))
      throw new Error("Billing sandbox requires a test key.");
    this.stripe =
      key && (mode === "sandbox" || mode === "live")
        ? new Stripe(key, { timeout: 15000, maxNetworkRetries: 1 })
        : null;
  }
  enabled() {
    return !!this.stripe && !!this.config.get("STRIPE_MEMBERSHIP_PRICE_ID");
  }
  private gateway() {
    if (!this.enabled())
      throw new ServiceUnavailableException(
        "Membership billing is not configured.",
      );
    return this.stripe!;
  }
  private async exclusive<T>(userId: string, work: () => Promise<T>) {
    const key = `billing:${userId}`,
      owner = randomUUID();
    if (!(await this.redis.acquireLock(key, owner, 120000)))
      throw new ConflictException("Membership is updating. Please retry.");
    try {
      return await work();
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }
  async checkout(userId: string, requestId: string) {
    return this.exclusive(userId, async () => {
      const stripe = this.gateway();
      const user = await this.users.findById(userId).exec();
      if (!user) throw new NotFoundException("Account not found.");
      if (user.membershipSubscriptionId) {
        const sub = await stripe.subscriptions.retrieve(
          user.membershipSubscriptionId,
        );
        if (!["canceled", "incomplete_expired"].includes(sub.status))
          throw new BadRequestException(
            "A subscription already exists. Manage it before starting another.",
          );
      }
      if (user.membershipCheckoutId) {
        const previous = await stripe.checkout.sessions.retrieve(
          user.membershipCheckoutId,
        );
        if (previous.status === "open" && previous.url)
          return { checkoutUrl: previous.url };
        if (previous.status === "complete") {
          await this.syncSession(userId, previous.id);
          const updated = await this.users.findById(userId).exec();
          if (updated?.membershipSubscriptionId) {
            const sub = await stripe.subscriptions.retrieve(
              updated.membershipSubscriptionId,
            );
            if (!["canceled", "incomplete_expired"].includes(sub.status))
              throw new BadRequestException(
                "Membership checkout completed. Refresh your membership.",
              );
          }
        }
      }
      const priceId = this.config.get<string>("STRIPE_MEMBERSHIP_PRICE_ID")!;
      const price = await stripe.prices.retrieve(priceId);
      if (
        !price.active ||
        price.currency !== "eur" ||
        price.unit_amount !== 499 ||
        price.recurring?.interval !== "day" ||
        price.recurring.interval_count !== 30
      )
        throw new ServiceUnavailableException(
          "Membership price does not match the published €4.99 / 30 day terms.",
        );
      if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create(
          { metadata: { userId } },
          { idempotencyKey: `saved-cards:${userId}` },
        );
        user.stripeCustomerId = customer.id;
        await user.save();
      }
      const origin = new URL(
        this.config.get<string>("CUSTOMER_APP_URL") || "http://localhost:8051",
      );
      if (
        this.config.get("NODE_ENV") === "production" &&
        origin.protocol !== "https:"
      )
        throw new ServiceUnavailableException(
          "Checkout requires an HTTPS customer app URL.",
        );
      const session = await stripe.checkout.sessions.create(
        {
          mode: "subscription",
          customer: user.stripeCustomerId,
          line_items: [{ price: priceId, quantity: 1 }],
          client_reference_id: userId,
          metadata: { userId, purpose: "membership" },
          subscription_data: { metadata: { userId, purpose: "membership" } },
          success_url: `${origin.origin}/rewards/?checkout=complete`,
          cancel_url: `${origin.origin}/rewards/?checkout=cancelled`,
        },
        { idempotencyKey: `membership:${userId}:${requestId}` },
      );
      await this.users.updateOne(
        { _id: userId },
        { $set: { membershipCheckoutId: session.id } },
      );
      if (!session.url)
        throw new ServiceUnavailableException("Checkout is not available.");
      return { checkoutUrl: session.url };
    });
  }
  private async syncSession(userId: string, sessionId: string) {
    const session = await this.stripe!.checkout.sessions.retrieve(sessionId);
    if (
      session.client_reference_id !== userId ||
      session.metadata?.purpose !== "membership"
    )
      throw new BadRequestException("Invalid membership checkout.");
    if (session.status !== "complete" || !session.subscription) return;
    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
    await this.syncSubscription(subscriptionId);
  }
  async refresh(userId: string) {
    if (!this.enabled()) return;
    return this.exclusive(userId, async () => {
      const user = await this.users.findById(userId).exec();
      if (user?.membershipCheckoutId)
        await this.syncSession(userId, user.membershipCheckoutId);
      if (user?.membershipSubscriptionId)
        await this.syncSubscription(user.membershipSubscriptionId);
    });
  }
  async syncSubscription(subscriptionId: string) {
    if (!this.stripe) return;
    const sub = await this.stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["latest_invoice"],
    });
    if (sub.metadata.purpose !== "membership") return;
    const userId = sub.metadata.userId;
    const user = await this.users.findById(userId).exec();
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    if (!user || user.stripeCustomerId !== customerId)
      throw new BadRequestException("Membership customer mismatch.");
    // Ignore late events from an older subscription after a replacement has been recorded.
    if (
      user.membershipSubscriptionId &&
      user.membershipSubscriptionId !== sub.id
    ) {
      const current = await this.stripe.subscriptions.retrieve(
        user.membershipSubscriptionId,
      );
      if (!["canceled", "incomplete_expired"].includes(current.status)) return;
    }
    const priceId = this.config.get<string>("STRIPE_MEMBERSHIP_PRICE_ID");
    const item = sub.items.data.find(
      (i) => i.price.id === priceId && i.quantity === 1,
    );
    if (!item || sub.items.data.length !== 1)
      throw new BadRequestException("Membership plan mismatch.");
    const invoice =
      typeof sub.latest_invoice === "object" ? sub.latest_invoice : null;
    const paidLine = invoice?.lines.data.find(
      (line) =>
        line.pricing?.price_details?.price === priceId && line.amount >= 499,
    );
    const update: Record<string, unknown> = {
      membershipSubscriptionId: sub.id,
      membershipStatus: sub.status,
      membershipCancelled:
        sub.cancel_at_period_end || sub.status === "canceled",
    };
    // No extension for failed/pending invoices. Preserve the already paid period.
    if (
      invoice?.status === "paid" &&
      invoice.amount_paid >= 499 &&
      invoice.currency === "eur" &&
      paidLine &&
      ["active", "past_due", "canceled"].includes(sub.status)
    ) {
      update.membershipUntil = new Date(paidLine.period.end * 1000);
    }
    await this.users.updateOne(
      { _id: userId, stripeCustomerId: customerId },
      { $set: update },
    );
  }
  async cancel(userId: string) {
    // Cancelling renewal is idempotent. A Stripe webhook may briefly hold the
    // per-user lock after the first request has already persisted this state;
    // do not turn an immediate retry into a spurious 409 in that case.
    const current = await this.users.findById(userId).exec();
    if (current?.membershipSubscriptionId && current.membershipCancelled)
      return;
    return this.exclusive(userId, async () => {
      const stripe = this.gateway();
      const user = await this.users.findById(userId).exec();
      if (!user?.membershipSubscriptionId)
        throw new BadRequestException("No subscription to cancel.");
      if (user.membershipCancelled) return;
      const sub = await stripe.subscriptions.retrieve(
        user.membershipSubscriptionId,
      );
      if (!["canceled", "incomplete_expired"].includes(sub.status))
        await stripe.subscriptions.update(sub.id, {
          cancel_at_period_end: true,
        });
      await this.syncSubscription(sub.id);
    });
  }
  async portal(userId: string) {
    const stripe = this.gateway();
    const user = await this.users.findById(userId).exec();
    if (!user?.stripeCustomerId || !user.membershipSubscriptionId)
      throw new BadRequestException("No subscription to manage.");
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${new URL(this.config.get<string>("CUSTOMER_APP_URL") || "http://localhost:8051").origin}/rewards/`,
    });
    return { checkoutUrl: session.url };
  }
  private async syncEventSubscription(subscriptionId: string) {
    const subscription =
      await this.stripe!.subscriptions.retrieve(subscriptionId);
    if (
      subscription.metadata.purpose !== "membership" ||
      !subscription.metadata.userId
    )
      return;
    await this.exclusive(subscription.metadata.userId, () =>
      this.syncSubscription(subscriptionId),
    );
  }
  async handleEvent(event: Stripe.Event) {
    if (!this.stripe) return;
    if (event.type.startsWith("customer.subscription."))
      await this.syncEventSubscription(
        (event.data.object as Stripe.Subscription).id,
      );
    if (event.type.startsWith("invoice.")) {
      const invoice = event.data.object as Stripe.Invoice;
      const sub = invoice.parent?.subscription_details?.subscription;
      if (sub)
        await this.syncEventSubscription(
          typeof sub === "string" ? sub : sub.id,
        );
    }
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (
        session.metadata?.purpose === "membership" &&
        session.client_reference_id
      )
        await this.exclusive(session.client_reference_id, () =>
          this.syncSession(session.client_reference_id!, session.id),
        );
    }
  }
  @Cron("0 */10 * * * *")
  async reconcile() {
    if (!this.enabled()) return;
    const cursor = this.users
      .find({
        membershipSubscriptionId: { $exists: true },
        membershipStatus: { $nin: ["canceled", "incomplete_expired"] },
      })
      .cursor();
    for await (const user of cursor) {
      try {
        await this.refresh(user.id);
      } catch {
        this.logger.warn(`Membership reconciliation pending for ${user.id}`);
      }
    }
  }
}

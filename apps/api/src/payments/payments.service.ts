import { WalletService } from "../wallet/wallet.module";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Optional,
  OnModuleInit,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { toCustomerView } from "../orders/orders.sanitizer";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import Stripe from "stripe";
import { randomUUID } from "crypto";
import { RedisService } from "../redis/redis.service";
import { cashAvailabilityFromTrust } from "../account/cash-trust.util";
import { AccountService } from "../account/account.service";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import { DispatchService } from "../dispatch/dispatch.service";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { InitiatePaymentDto } from "./dto/payment.dto";
import { Payment, PaymentDocument } from "./schemas/payment.schema";

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);
  private stripe: Stripe | null = null;

  constructor(
    @InjectModel(Payment.name)
    private readonly payments: Model<PaymentDocument>,
    @InjectModel(Order.name) private readonly orders: Model<OrderDocument>,
    private readonly accounts: AccountService,
    private readonly dispatch: DispatchService,
    private readonly config: ConfigService,
    private readonly appConfig: AppConfigService,
    private readonly redis: RedisService,
    @Optional() private readonly wallet?: WalletService,
  ) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (
      this.config.get<string>("STRIPE_MODE") === "sandbox" &&
      (!key || !/^(sk|rk|rkcs)_test_/.test(key))
    ) {
      throw new Error(
        "Stripe sandbox mode requires a sandbox test secret key.",
      );
    }
    if (key) {
      this.stripe = new Stripe(key, { timeout: 15_000, maxNetworkRetries: 1 });
    }
  }

  async onModuleInit() {
    await this.payments.init();
  }

  /** Test helper — inject a mock Stripe client. */
  setStripeClient(client: Stripe | null) {
    this.stripe = client;
  }

  async cashAvailability(userId: string) {
    const user = await this.accounts.findById(userId);
    if (!user) throw new NotFoundException("errors.notFound");
    const cfg = await this.appConfig.get();
    const score = user.cashTrustScore ?? 100;
    const trust = cashAvailabilityFromTrust(
      score,
      user.cashBanned,
      cfg.cashHardCapCents,
    );
    return {
      available: trust.available,
      failedCashCount: user.failedCashCount,
      threshold: cfg.cashFailThreshold,
      hardCapCents: trust.effectiveCapCents,
      cashTrustScore: score,
      cashTrustTier: trust.tier,
      reasonCode: trust.reasonCode,
    };
  }

  async initiate(userId: string, dto: InitiatePaymentDto) {
    return this.withOrderLock(dto.orderId, async () => {
      const result = await this.initiateOnce(userId, dto);
      // Dispatch ranking and kitchen identities are operations-only data.
      return {
        ...result,
        dispatch: result.dispatch
          ? {
              offerCount:
                (result.dispatch as { offerCount?: number }).offerCount ?? 0,
            }
          : null,
      };
    });
  }

  private async withOrderLock<T>(
    orderId: string,
    work: () => Promise<T>,
  ): Promise<T> {
    const owner = randomUUID();
    const key = `payment:${orderId}`;
    if (!(await this.redis.acquireLock(key, owner, 120_000))) {
      throw new ConflictException("Payment is being processed. Please retry.");
    }
    try {
      return await work();
    } finally {
      await this.redis.releaseLock(key, owner);
    }
  }

  private async initiateOnce(userId: string, dto: InitiatePaymentDto) {
    const order = await this.orders.findById(dto.orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (String(order.customerId) !== userId) {
      throw new ForbiddenException("errors.forbidden");
    }
    const method = dto.method ?? order.paymentMethod;
    if (method !== order.paymentMethod) {
      throw new BadRequestException(
        "Payment method does not match this order.",
      );
    }
    if (order.status === OrderStatus.CANCELLED)
      throw new BadRequestException("Order is cancelled.");
    const existing = await this.payments.findOne({ orderId: order._id }).exec();
    if (existing) {
      if (existing.method !== method)
        throw new BadRequestException("Payment method cannot be changed.");
      if (
        existing.method === PaymentMethod.CARD &&
        !existing.mock &&
        existing.providerRef &&
        this.stripe &&
        order.status === OrderStatus.PENDING_PAYMENT
      ) {
        const intent = await this.stripe.paymentIntents.retrieve(
          existing.providerRef,
        );
        if (intent.status === "succeeded") {
          const result = await this.captureIntent(existing.providerRef);
          return {
            payment: existing,
            orderStatus: order.status,
            dispatch: result.dispatch ?? null,
            mock: false,
          };
        }
        return {
          payment: existing,
          orderStatus: order.status,
          dispatch: null,
          mock: false,
          clientSecret: intent.client_secret,
        };
      }
      if (!existing.mock && existing.status !== PaymentStatus.CAPTURED) {
        throw new BadRequestException(
          "Card payment is temporarily unavailable.",
        );
      }
      // Recover after an interrupted save/dispatch without creating another payment.
      if (order.status === OrderStatus.PENDING_PAYMENT) {
        order.paymentStatus = existing.status;
        await order.save();
        const dispatch = await this.dispatch.startDispatch(order.id);
        return {
          payment: existing,
          orderStatus:
            order.scheduledAt && order.scheduledAt.getTime() > Date.now()
              ? OrderStatus.SCHEDULED
              : OrderStatus.PENDING_OFFERS,
          dispatch,
          mock: existing.mock,
        };
      }
      return {
        payment: existing,
        orderStatus: order.status,
        dispatch: null,
        mock: existing.mock,
      };
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException("errors.badRequest");
    }
    if (method === PaymentMethod.WALLET) {
      if (!this.wallet)
        throw new BadRequestException("Yespizz credit is unavailable.");
      await this.wallet.change(
        userId,
        `payment:${order.id}`,
        -order.totalCents,
        order.id,
      );
      const payment = await this.payments.create({
        orderId: order._id,
        customerId: order.customerId,
        method,
        status: PaymentStatus.CAPTURED,
        amountCents: order.totalCents,
        mock: false,
        providerRef: `wallet:${order.id}`,
      });
      order.paymentStatus = PaymentStatus.CAPTURED;
      await order.save();
      const dispatch = await this.dispatch.startDispatch(order.id);
      return {
        payment,
        orderStatus:
          order.scheduledAt && order.scheduledAt.getTime() > Date.now()
            ? OrderStatus.SCHEDULED
            : OrderStatus.PENDING_OFFERS,
        dispatch,
        mock: false,
      };
    }
    if (method === PaymentMethod.CASH) {
      const avail = await this.cashAvailability(userId);
      if (!avail.available) {
        throw new BadRequestException("errors.badRequest");
      }
      if (order.totalCents > avail.hardCapCents) {
        throw new BadRequestException("errors.badRequest");
      }
      order.paymentMethod = PaymentMethod.CASH;
      order.paymentStatus = PaymentStatus.AUTHORIZED;
      const payment = await this.payments.create({
        orderId: order._id,
        customerId: order.customerId,
        method,
        status: PaymentStatus.AUTHORIZED,
        amountCents: order.totalCents,
        mock: true,
      });
      await order.save();
      const dispatchResult = await this.dispatch.startDispatch(order.id);
      return {
        payment,
        orderStatus:
          order.scheduledAt && order.scheduledAt.getTime() > Date.now()
            ? OrderStatus.SCHEDULED
            : OrderStatus.PENDING_OFFERS,
        dispatch: dispatchResult,
      };
    }

    const stripeKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (stripeKey && this.stripe) {
      return this.initiateStripe(order, method);
    }

    if (this.config.get<string>("NODE_ENV") === "production") {
      throw new BadRequestException(
        "Card payments are unavailable. Please choose cash.",
      );
    }
    // Mock capture when Stripe is not configured
    const status = PaymentStatus.CAPTURED;
    const payment = await this.payments.create({
      orderId: order._id,
      customerId: order.customerId,
      method,
      status,
      amountCents: order.totalCents,
      mock: true,
      providerRef: `mock_${Date.now()}`,
    });

    order.paymentMethod = method;
    order.paymentStatus = status;
    await order.save();

    const dispatchResult = await this.dispatch.startDispatch(order.id);
    return {
      payment,
      orderStatus:
        order.scheduledAt && order.scheduledAt.getTime() > Date.now()
          ? OrderStatus.SCHEDULED
          : OrderStatus.PENDING_OFFERS,
      dispatch: dispatchResult,
      mock: true,
    };
  }

  private async initiateStripe(order: OrderDocument, method: PaymentMethod) {
    const intent = await this.stripe!.paymentIntents.create(
      {
        amount: order.totalCents,
        currency: "eur",
        payment_method_types: ["card", "klarna"],
        capture_method: "automatic",
        metadata: {
          orderId: order.id,
          customerId: String(order.customerId),
        },
      },
      { idempotencyKey: `order:${order.id}` },
    );

    const payment = await this.payments.create({
      orderId: order._id,
      customerId: order.customerId,
      method,
      status: PaymentStatus.PENDING,
      amountCents: order.totalCents,
      mock: false,
      providerRef: intent.id,
    });

    order.paymentMethod = method;
    order.paymentStatus = PaymentStatus.PENDING;
    await order.save();

    return {
      payment,
      orderStatus: order.status,
      mock: false,
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      dispatch: null,
    };
  }

  /**
   * Mark payment captured and start dispatch when order is still PENDING_PAYMENT.
   * Idempotent for already-captured payments.
   */
  async confirm(userId: string, orderId: string) {
    const order = await this.orders.findById(orderId).exec();
    if (!order || String(order.customerId) !== userId)
      throw new NotFoundException("errors.notFound");
    const payment = await this.payments.findOne({ orderId: order._id }).exec();
    if (!payment?.providerRef || payment.mock || !this.stripe)
      throw new BadRequestException("errors.badRequest");
    const result = await this.captureFromStripeIntent(payment.providerRef);
    return { ok: result.ok, orderId: order.id };
  }

  async captureFromStripeIntent(paymentIntentId: string) {
    const payment = await this.payments
      .findOne({ providerRef: paymentIntentId })
      .exec();
    if (!payment) return { ok: false, reason: "payment_not_found" };
    return this.withOrderLock(String(payment.orderId), () =>
      this.captureIntent(paymentIntentId),
    );
  }

  private async captureIntent(paymentIntentId: string) {
    const payment = await this.payments
      .findOne({ providerRef: paymentIntentId })
      .exec();
    if (!payment) {
      this.logger.warn(`No payment for intent ${paymentIntentId}`);
      return { ok: false, reason: "payment_not_found" };
    }

    const cancelled = await this.orders.findById(payment.orderId).exec();
    if (cancelled?.status === OrderStatus.CANCELLED) {
      await this.refundCancelled(cancelled);
      return {
        ok: true,
        orderId: cancelled.id,
        orderStatus: cancelled.status,
        dispatch: null,
      };
    }
    if (!cancelled) return { ok: false, reason: "order_not_found" };
    if (!payment.mock && this.stripe) {
      const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      if (
        intent.status !== "succeeded" ||
        intent.amount_received !== cancelled.totalCents ||
        payment.amountCents !== cancelled.totalCents ||
        intent.currency !== "eur" ||
        intent.metadata.orderId !== cancelled.id ||
        intent.metadata.customerId !== String(cancelled.customerId) ||
        (this.config.get<string>("STRIPE_MODE") === "sandbox" &&
          intent.livemode)
      ) {
        throw new BadRequestException(
          "Payment does not match this order or is not confirmed yet.",
        );
      }
    } else if (
      !payment.mock &&
      this.config.get<string>("NODE_ENV") === "production"
    ) {
      throw new ServiceUnavailableException(
        "Stripe payment verification is unavailable.",
      );
    }
    if (payment.status === PaymentStatus.REFUNDED)
      return { ok: true, dispatch: null };
    if (payment.status !== PaymentStatus.CAPTURED) {
      payment.status = PaymentStatus.CAPTURED;
      await payment.save();
    }

    const order = await this.orders.findById(payment.orderId).exec();
    if (!order) {
      return { ok: false, reason: "order_not_found" };
    }

    order.paymentStatus = PaymentStatus.CAPTURED;
    let dispatchResult: unknown = null;
    if (order.status === OrderStatus.PENDING_PAYMENT) {
      await order.save();
      dispatchResult = await this.dispatch.startDispatch(order.id);
    } else {
      await order.save();
    }

    return {
      ok: true,
      orderId: order.id,
      orderStatus: order.status,
      dispatch: dispatchResult,
    };
  }

  async cancel(userId: string, orderId: string, reason: string) {
    return this.withOrderLock(orderId, async () => {
      const owner = randomUUID();
      const waveKey = `order:wave:${orderId}`;
      if (!(await this.redis.acquireLock(waveKey, owner, 120_000)))
        throw new ConflictException("Order is being assigned. Please retry.");
      try {
        let order = await this.orders.findById(orderId).exec();
        if (!order || String(order.customerId) !== userId)
          throw new NotFoundException("errors.notFound");
        if (order.status !== OrderStatus.CANCELLED) {
          if (
            ![
              OrderStatus.PENDING_PAYMENT,
              OrderStatus.PENDING_OFFERS,
              OrderStatus.SCHEDULED,
            ].includes(order.status)
          )
            throw new BadRequestException(
              "Preparation has started. Contact support to cancel.",
            );
          order = await this.orders
            .findOneAndUpdate(
              { _id: order._id, status: order.status },
              {
                $set: {
                  status: OrderStatus.CANCELLED,
                  cancellationReason: reason,
                  cancelledBy: userId,
                },
              },
              { new: true },
            )
            .exec();
          if (!order)
            throw new ConflictException("Order changed. Please refresh.");
        }
        await this.refundCancelled(order);
        return toCustomerView(order);
      } finally {
        await this.redis.releaseLock(waveKey, owner);
      }
    });
  }

  async listRefunds() {
    return this.payments
      .find({ refundStatus: { $exists: true } })
      .sort({ updatedAt: -1 })
      .limit(100)
      .select(
        "orderId amountCents refundId refundStatus refundError refundedAt",
      )
      .exec();
  }

  async reconcileRefund(orderId: string) {
    return this.withOrderLock(orderId, async () => {
      const order = await this.orders.findById(orderId).exec();
      if (!order || order.status !== OrderStatus.CANCELLED)
        throw new BadRequestException(
          "Only cancelled orders can be refunded here.",
        );
      await this.refundCancelled(order);
      return {
        orderId,
        paymentStatus: order.paymentStatus,
        refundStatus: order.refundStatus,
      };
    });
  }

  // Durable reconciliation covers admin cancellation, exhausted dispatch waves,
  // process restarts and webhooks arriving after cancellation.
  @Cron("*/30 * * * * *")
  async reconcileCancelledOrders() {
    const orders = await this.orders
      .find({
        status: OrderStatus.CANCELLED,
        paymentStatus: {
          $nin: [PaymentStatus.REFUNDED, PaymentStatus.CANCELLED],
        },
      })
      .limit(100)
      .exec();
    for (const order of orders) {
      try {
        await this.reconcileRefund(order.id);
      } catch {
        this.logger.warn(`Refund reconciliation pending for order ${order.id}`);
      }
    }
  }

  private async refundCancelled(order: OrderDocument) {
    const payment = await this.payments.findOne({ orderId: order._id }).exec();
    if (!payment) {
      if (order.paymentMethod === PaymentMethod.WALLET)
        await this.wallet?.refundPurchase(String(order.customerId), order.id);
      order.paymentStatus = PaymentStatus.CANCELLED;
      await order.save();
      return;
    }
    try {
      if (payment.method === PaymentMethod.WALLET) {
        if (!this.wallet) throw new Error("Credit service unavailable.");
        await this.wallet.change(
          String(order.customerId),
          `refund:${order.id}`,
          payment.amountCents,
          order.id,
        );
        payment.status = PaymentStatus.REFUNDED;
        payment.refundStatus = "succeeded";
        payment.refundedAt = new Date();
      } else if (payment.method === PaymentMethod.CASH) {
        payment.status = PaymentStatus.CANCELLED;
      } else if (payment.mock) {
        if (this.config.get<string>("NODE_ENV") === "production")
          throw new Error("Mock payment in production requires review.");
        payment.status = PaymentStatus.REFUNDED;
        payment.refundStatus = "succeeded";
      } else {
        if (!this.stripe || !payment.providerRef)
          throw new Error("Stripe is not configured.");
        let intent = await this.stripe.paymentIntents.retrieve(
          payment.providerRef,
        );
        if (intent.status !== "succeeded" && intent.status !== "canceled") {
          intent = await this.stripe.paymentIntents.cancel(
            intent.id,
            {},
            { idempotencyKey: `cancel:${order.id}` },
          );
        }
        if (intent.status === "canceled") {
          payment.status = PaymentStatus.CANCELLED;
        } else if (intent.status === "succeeded") {
          // Look up an existing refund before creating, including after a crash
          // longer than Stripe's idempotency retention window.
          const previous = payment.refundId
            ? await this.stripe.refunds.retrieve(payment.refundId)
            : (
                await this.stripe.refunds.list({
                  payment_intent: intent.id,
                  limit: 100,
                })
              ).data.find((r) => r.metadata?.orderId === order.id);
          const refund =
            previous ??
            (await this.stripe.refunds.create(
              {
                payment_intent: intent.id,
                amount: payment.amountCents,
                metadata: { orderId: order.id },
                reason: "requested_by_customer",
              },
              { idempotencyKey: `refund:${order.id}` },
            ));
          payment.refundId = refund.id;
          payment.refundStatus = refund.status ?? "pending";
          if (refund.status === "succeeded") {
            payment.status = PaymentStatus.REFUNDED;
            payment.refundedAt = new Date();
          }
        }
      }
      payment.refundError = undefined;
      await payment.save();
      order.paymentStatus = payment.status;
      order.refundStatus = payment.refundStatus;
      await order.save();
    } catch {
      payment.refundStatus = "retry_pending";
      // Do not store gateway errors containing sensitive response details.
      payment.refundError =
        "Gateway reconciliation failed; automatic retry scheduled.";
      await payment.save();
      order.refundStatus = "retry_pending";
      await order.save();
      this.logger.warn(`Refund pending for order ${order.id}`);
    }
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string | undefined,
    fallbackBody?: Record<string, unknown>,
  ) {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    let event: { type: string; data?: { object?: { id?: string } } };

    if (webhookSecret && this.stripe) {
      if (!signature) {
        throw new BadRequestException("errors.badRequest");
      }
      try {
        event = this.stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        ) as unknown as typeof event;
      } catch (err) {
        this.logger.warn(
          `Stripe signature verification failed: ${(err as Error).message}`,
        );
        throw new BadRequestException("errors.badRequest");
      }
    } else {
      if (this.config.get<string>("NODE_ENV") === "production" || this.stripe) {
        throw new BadRequestException(
          "Stripe webhook verification is not configured.",
        );
      }
      // Test / MVP mode — accept JSON event type without signature
      event = (fallbackBody ?? {}) as typeof event;
      if (!event.type) {
        try {
          event = JSON.parse(rawBody.toString("utf8")) as typeof event;
        } catch {
          throw new BadRequestException("errors.badRequest");
        }
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const intentId = event.data?.object?.id;
      if (!intentId) {
        throw new BadRequestException("errors.badRequest");
      }
      const result = await this.captureFromStripeIntent(intentId);
      if (!result.ok)
        throw new ServiceUnavailableException(
          "Payment reconciliation pending.",
        );
      return { received: true, ...result };
    }

    return { received: true, ignored: event.type };
  }
}

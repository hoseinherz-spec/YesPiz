import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import Stripe from "stripe";
import { cashAvailabilityFromTrust } from "../account/cash-trust.util";
import { AccountService } from "../account/account.service";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import { DispatchService } from "../dispatch/dispatch.service";
import { Order, OrderDocument } from "../orders/schemas/order.schema";
import { InitiatePaymentDto } from "./dto/payment.dto";
import { Payment, PaymentDocument } from "./schemas/payment.schema";

@Injectable()
export class PaymentsService {
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
  ) {
    const key = this.config.get<string>("STRIPE_SECRET_KEY");
    if (key) {
      this.stripe = new Stripe(key);
    }
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
    const order = await this.orders.findById(dto.orderId).exec();
    if (!order) throw new NotFoundException("errors.notFound");
    if (String(order.customerId) !== userId) {
      throw new ForbiddenException("errors.forbidden");
    }
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException("errors.badRequest");
    }

    const method = dto.method ?? order.paymentMethod;
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
      order.status = OrderStatus.PENDING_OFFERS;
      await order.save();
      const payment = await this.payments.create({
        orderId: order._id,
        customerId: order.customerId,
        method,
        status: PaymentStatus.AUTHORIZED,
        amountCents: order.totalCents,
        mock: true,
      });
      const dispatchResult = await this.dispatch.startDispatch(order.id);
      return { payment, orderStatus: order.status, dispatch: dispatchResult };
    }

    const stripeKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (stripeKey && this.stripe) {
      return this.initiateStripe(order, method);
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
      orderStatus: OrderStatus.PENDING_OFFERS,
      dispatch: dispatchResult,
      mock: true,
    };
  }

  private async initiateStripe(order: OrderDocument, method: PaymentMethod) {
    const intent = await this.stripe!.paymentIntents.create({
      amount: order.totalCents,
      currency: "eur",
      capture_method: "automatic",
      metadata: {
        orderId: order.id,
        customerId: String(order.customerId),
      },
    });

    const payment = await this.payments.create({
      orderId: order._id,
      customerId: order.customerId,
      method,
      status: PaymentStatus.AUTHORIZED,
      amountCents: order.totalCents,
      mock: false,
      providerRef: intent.id,
    });

    order.paymentMethod = method;
    order.paymentStatus = PaymentStatus.AUTHORIZED;
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
  async captureFromStripeIntent(paymentIntentId: string) {
    const payment = await this.payments
      .findOne({ providerRef: paymentIntentId })
      .exec();
    if (!payment) {
      this.logger.warn(`No payment for intent ${paymentIntentId}`);
      return { ok: false, reason: "payment_not_found" };
    }

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
      return { received: true, ...result };
    }

    return { received: true, ignored: event.type };
  }
}

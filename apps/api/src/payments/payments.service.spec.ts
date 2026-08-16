import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { AccountService } from "../account/account.service";
import { AppConfigService } from "../app-config/app-config.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import { DispatchService } from "../dispatch/dispatch.service";
import { Order } from "../orders/schemas/order.schema";
import { PaymentsService } from "./payments.service";
import { Payment } from "./schemas/payment.schema";

describe("PaymentsService", () => {
  let service: PaymentsService;
  let paymentsCreate: jest.Mock;
  let paymentsFindOne: jest.Mock;
  let orderSave: jest.Mock;
  let findOrderById: jest.Mock;
  let findUserById: jest.Mock;
  let startDispatch: jest.Mock;
  let configGet: jest.Mock;
  let appConfigGet: jest.Mock;

  const customerId = "507f1f77bcf86cd799439001";
  const orderId = "507f1f77bcf86cd799439002";

  function makeOrder(overrides: Record<string, unknown> = {}) {
    orderSave = jest.fn().mockResolvedValue(undefined);
    return {
      _id: orderId,
      id: orderId,
      customerId,
      status: OrderStatus.PENDING_PAYMENT,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.PENDING,
      totalCents: 1500,
      save: orderSave,
      ...overrides,
    };
  }

  beforeEach(async () => {
    paymentsCreate = jest.fn();
    paymentsFindOne = jest.fn();
    findOrderById = jest.fn();
    findUserById = jest.fn();
    startDispatch = jest.fn().mockResolvedValue({ offerCount: 1 });
    configGet = jest.fn();
    appConfigGet = jest.fn().mockResolvedValue({
      cashFailThreshold: 3,
      cashHardCapCents: 50_000,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        {
          provide: getModelToken(Payment.name),
          useValue: { create: paymentsCreate, findOne: paymentsFindOne },
        },
        {
          provide: getModelToken(Order.name),
          useValue: { findById: findOrderById },
        },
        {
          provide: AccountService,
          useValue: { findById: findUserById },
        },
        {
          provide: DispatchService,
          useValue: { startDispatch },
        },
        {
          provide: ConfigService,
          useValue: { get: configGet },
        },
        {
          provide: AppConfigService,
          useValue: { get: appConfigGet },
        },
      ],
    }).compile();

    service = module.get(PaymentsService);
  });

  it("captures with mock=true when STRIPE_SECRET_KEY is unset", async () => {
    const order = makeOrder();
    findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
    configGet.mockReturnValue(undefined);
    paymentsCreate.mockResolvedValue({
      id: "pay1",
      mock: true,
      status: PaymentStatus.CAPTURED,
    });

    const result = await service.initiate(customerId, {
      orderId,
      method: PaymentMethod.CARD,
    });

    expect(configGet).toHaveBeenCalledWith("STRIPE_SECRET_KEY");
    expect(paymentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId,
        customerId,
        method: PaymentMethod.CARD,
        status: PaymentStatus.CAPTURED,
        amountCents: 1500,
        mock: true,
        providerRef: expect.stringMatching(/^mock_/),
      }),
    );
    expect(order.paymentStatus).toBe(PaymentStatus.CAPTURED);
    expect(orderSave).toHaveBeenCalled();
    expect(startDispatch).toHaveBeenCalledWith(orderId);
    expect(result.mock).toBe(true);
    expect(result.orderStatus).toBe(OrderStatus.PENDING_OFFERS);
  });

  it("creates PaymentIntent and defers dispatch when Stripe is configured", async () => {
    const order = makeOrder();
    findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
    configGet.mockImplementation((key: string) =>
      key === "STRIPE_SECRET_KEY" ? "sk_test_x" : undefined,
    );

    const createIntent = jest.fn().mockResolvedValue({
      id: "pi_test_123",
      client_secret: "pi_test_123_secret",
    });
    service.setStripeClient({
      paymentIntents: { create: createIntent },
    } as never);

    paymentsCreate.mockResolvedValue({
      id: "pay2",
      mock: false,
      status: PaymentStatus.AUTHORIZED,
      providerRef: "pi_test_123",
    });

    const result = await service.initiate(customerId, {
      orderId,
      method: PaymentMethod.CARD,
    });

    expect(createIntent).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 1500,
        currency: "eur",
        metadata: { orderId, customerId },
      }),
    );
    expect(paymentsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: PaymentStatus.AUTHORIZED,
        mock: false,
        providerRef: "pi_test_123",
      }),
    );
    expect(startDispatch).not.toHaveBeenCalled();
    expect(result.mock).toBe(false);
    expect((result as { clientSecret?: string }).clientSecret).toBe(
      "pi_test_123_secret",
    );
    expect(result.dispatch).toBeNull();
    expect(order.status).toBe(OrderStatus.PENDING_PAYMENT);
  });

  it("captures from webhook and dispatches when order still PENDING_PAYMENT", async () => {
    const paymentSave = jest.fn().mockResolvedValue(undefined);
    const order = makeOrder();
    paymentsFindOne.mockReturnValue({
      exec: () =>
        Promise.resolve({
          orderId,
          status: PaymentStatus.AUTHORIZED,
          save: paymentSave,
        }),
    });
    findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });

    const result = await service.captureFromStripeIntent("pi_test_123");

    expect(paymentSave).toHaveBeenCalled();
    expect(order.paymentStatus).toBe(PaymentStatus.CAPTURED);
    expect(startDispatch).toHaveBeenCalledWith(orderId);
    expect(result.ok).toBe(true);
  });

  it("accepts payment_intent.succeeded in test mode without webhook secret", async () => {
    const paymentSave = jest.fn().mockResolvedValue(undefined);
    const order = makeOrder();
    paymentsFindOne.mockReturnValue({
      exec: () =>
        Promise.resolve({
          orderId,
          status: PaymentStatus.AUTHORIZED,
          save: paymentSave,
        }),
    });
    findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
    configGet.mockReturnValue(undefined);

    const raw = Buffer.from(
      JSON.stringify({
        type: "payment_intent.succeeded",
        data: { object: { id: "pi_test_abc" } },
      }),
    );

    const result = await service.handleStripeWebhook(raw, undefined);
    expect(result.received).toBe(true);
    expect(startDispatch).toHaveBeenCalledWith(orderId);
  });

  it("reports cash unavailable when user is cashBanned", async () => {
    findUserById.mockResolvedValue({
      cashBanned: true,
      failedCashCount: 2,
      cashTrustScore: 0,
    });

    const avail = await service.cashAvailability(customerId);
    expect(avail).toEqual({
      available: false,
      failedCashCount: 2,
      threshold: 3,
      hardCapCents: 0,
      cashTrustScore: 0,
      cashTrustTier: "banned",
      reasonCode: "cash_trust_restricted",
    });
  });

  it("blocks cash when trust score is below 40", async () => {
    findUserById.mockResolvedValue({
      cashBanned: false,
      failedCashCount: 1,
      cashTrustScore: 35,
    });

    const avail = await service.cashAvailability(customerId);
    expect(avail.available).toBe(false);
    expect(avail.reasonCode).toBe("cash_trust_low");
    expect(avail.hardCapCents).toBe(0);
  });

  it("rejects cash initiate when cashBanned", async () => {
    const order = makeOrder({ paymentMethod: PaymentMethod.CASH });
    findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
    findUserById.mockResolvedValue({
      cashBanned: true,
      failedCashCount: 1,
      cashTrustScore: 0,
    });

    await expect(
      service.initiate(customerId, {
        orderId,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(paymentsCreate).not.toHaveBeenCalled();
    expect(startDispatch).not.toHaveBeenCalled();
  });

  it("rejects cash initiate when total exceeds hard cap", async () => {
    const order = makeOrder({
      paymentMethod: PaymentMethod.CASH,
      totalCents: 50_001,
    });
    findOrderById.mockReturnValue({ exec: () => Promise.resolve(order) });
    findUserById.mockResolvedValue({
      cashBanned: false,
      failedCashCount: 0,
      cashTrustScore: 100,
    });

    await expect(
      service.initiate(customerId, {
        orderId,
        method: PaymentMethod.CASH,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(paymentsCreate).not.toHaveBeenCalled();
  });
});

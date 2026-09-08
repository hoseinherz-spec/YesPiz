import { PaymentsService } from "./payments.service";
import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import Stripe from "stripe";

describe("Cancellation refund recovery", () => {
  function setup() {
    const order = {
      id: "507f1f77bcf86cd799439002",
      _id: "507f1f77bcf86cd799439002",
      status: OrderStatus.CANCELLED,
      paymentStatus: PaymentStatus.CAPTURED,
      save: jest.fn(),
    };
    const payment = {
      orderId: order.id,
      method: PaymentMethod.CARD,
      providerRef: "pi_refund",
      amountCents: 1500,
      status: PaymentStatus.CAPTURED,
      mock: false,
      refundId: undefined as string | undefined,
      refundStatus: undefined as string | undefined,
      save: jest.fn(),
    };
    const startDispatch = jest.fn();
    const service = new PaymentsService(
      { findOne: () => ({ exec: async () => payment }) } as never,
      { findById: () => ({ exec: async () => order }) } as never,
      {} as never,
      { startDispatch } as never,
      { get: () => undefined } as never,
      {} as never,
      {
        acquireLock: async () => true,
        releaseLock: async () => undefined,
      } as never,
    );
    const create = jest
      .fn()
      .mockResolvedValue({ id: "re_once", status: "pending" });
    const retrieve = jest
      .fn()
      .mockResolvedValue({ id: "re_once", status: "succeeded" });
    const stripe = {
      paymentIntents: {
        retrieve: jest
          .fn()
          .mockResolvedValue({ id: "pi_refund", status: "succeeded" }),
      },
      refunds: {
        list: jest.fn().mockResolvedValue({ data: [] }),
        create,
        retrieve,
      },
    };
    service.setStripeClient(stripe as unknown as Stripe);
    return { service, order, payment, create, stripe, startDispatch };
  }
  it("reconciles a pending refund without creating it twice", async () => {
    const { service, order, payment, create } = setup();
    await service.reconcileRefund(order.id);
    expect(order.paymentStatus).toBe(PaymentStatus.CAPTURED);
    expect(payment.refundStatus).toBe("pending");
    await service.reconcileRefund(order.id);
    expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 1500 }),
      { idempotencyKey: `refund:${order.id}` },
    );
  });
  it("records a gateway failure for retry instead of claiming success", async () => {
    const { service, order, stripe } = setup();
    stripe.paymentIntents.retrieve.mockRejectedValue(new Error("network down"));
    const result = await service.reconcileRefund(order.id);
    expect(result.refundStatus).toBe("retry_pending");
    expect(order.paymentStatus).toBe(PaymentStatus.CAPTURED);
  });
  it("never dispatches a late payment on a cancelled order", async () => {
    const { service, order, payment, startDispatch } = setup();
    payment.mock = true;
    await service.captureFromStripeIntent("pi_late");
    expect(order.status).toBe(OrderStatus.CANCELLED);
    expect(order.paymentStatus).toBe(PaymentStatus.REFUNDED);
    expect(startDispatch).not.toHaveBeenCalled();
  });
  it("does not auto-retry a terminal failed refund with a second charge reversal", async () => {
    const { service, order, payment, stripe, create } = setup();
    payment.refundId = "re_failed";
    stripe.refunds.retrieve.mockResolvedValue({
      id: "re_failed",
      status: "failed",
    });
    await service.reconcileRefund(order.id);
    expect(payment.refundStatus).toBe("failed");
    expect(order.paymentStatus).toBe(PaymentStatus.CAPTURED);
    expect(create).not.toHaveBeenCalled();
  });
});

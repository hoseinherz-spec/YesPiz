import { BillingService } from "./billing.service";
import { ConfigService } from "@nestjs/config";
import type { Model } from "mongoose";
import type { UserDocument } from "../account/schemas/user.schema";
import type { RedisService } from "../redis/redis.service";

function fixture() {
  const user = {
    stripeCustomerId: "cus_owner",
    membershipUntil: new Date(1000),
  };
  const users = {
    findById: jest.fn(() => ({ exec: async () => user })),
    updateOne: jest.fn(async () => ({})),
  };
  const sub = {
    id: "sub_1",
    metadata: { purpose: "membership", userId: "user_1" },
    customer: "cus_owner",
    status: "active",
    cancel_at_period_end: false,
    items: { data: [{ price: { id: "price_plus" }, quantity: 1 }] },
    latest_invoice: {
      status: "paid",
      amount_paid: 499,
      currency: "eur",
      lines: {
        data: [
          {
            pricing: { price_details: { price: "price_plus" } },
            amount: 499,
            period: { end: 2000000 },
          },
        ],
      },
    },
  };
  const service = new BillingService(
    users as unknown as Model<UserDocument>,
    new ConfigService({
      STRIPE_MODE: "sandbox",
      STRIPE_SECRET_KEY: "sk_test_fixture",
      STRIPE_MEMBERSHIP_PRICE_ID: "price_plus",
    }),
    {} as RedisService,
  );
  const stripe = { subscriptions: { retrieve: jest.fn(async () => sub) } };
  Object.assign(service, { stripe });
  return { service, users, sub, user };
}
describe("Stripe membership entitlements", () => {
  it("grants exactly the paid invoice period and replay does not add days", async () => {
    const { service, users } = fixture();
    await service.syncSubscription("sub_1");
    await service.syncSubscription("sub_1");
    const updates = users.updateOne.mock.calls as unknown as Array<
      [object, { $set: { membershipUntil: Date } }]
    >;
    expect(updates[0][1].$set.membershipUntil.getTime()).toBe(2000000000);
    expect(updates[1][1].$set.membershipUntil).toEqual(
      updates[0][1].$set.membershipUntil,
    );
  });
  it("does not grant a renewal for an unpaid invoice", async () => {
    const { service, users, sub } = fixture();
    sub.latest_invoice.status = "open";
    sub.status = "past_due";
    await service.syncSubscription("sub_1");
    expect(users.updateOne).toHaveBeenCalledWith(expect.anything(), {
      $set: expect.not.objectContaining({ membershipUntil: expect.anything() }),
    });
  });
  it("rejects mismatched customers and prices", async () => {
    const { service, users, sub } = fixture();
    sub.customer = "cus_other";
    await expect(service.syncSubscription("sub_1")).rejects.toThrow(
      "customer mismatch",
    );
    sub.customer = "cus_owner";
    sub.items.data[0].price.id = "other";
    await expect(service.syncSubscription("sub_1")).rejects.toThrow(
      "plan mismatch",
    );
    expect(users.updateOne).not.toHaveBeenCalled();
  });
  it("retains the paid period when renewal is cancelled", async () => {
    const { service, users, sub } = fixture();
    sub.cancel_at_period_end = true;
    await service.syncSubscription("sub_1");
    expect(users.updateOne).toHaveBeenCalledWith(expect.anything(), {
      $set: expect.objectContaining({
        membershipCancelled: true,
        membershipUntil: new Date(2000000000),
      }),
    });
  });
  it("treats an already-cancelled renewal as an idempotent success", async () => {
    const { service, sub, user } = fixture();
    Object.assign(user, {
      membershipSubscriptionId: sub.id,
      membershipCancelled: true,
    });
    await expect(service.cancel("user_1")).resolves.toBeUndefined();
    expect(
      (
        service as unknown as {
          stripe: { subscriptions: { retrieve: jest.Mock } };
        }
      ).stripe.subscriptions.retrieve,
    ).not.toHaveBeenCalled();
  });
});

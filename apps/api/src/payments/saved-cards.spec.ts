import { NotFoundException, ServiceUnavailableException } from "@nestjs/common";
import { PaymentsService } from "./payments.service";

describe("Saved cards", () => {
  const user = { stripeCustomerId: "cus_owner", save: jest.fn() };
  let service: PaymentsService;
  let stripe: {
    customers: { create: jest.Mock };
    setupIntents: { create: jest.Mock };
    paymentMethods: { list: jest.Mock; retrieve: jest.Mock; detach: jest.Mock };
  };
  beforeEach(() => {
    stripe = {
      customers: { create: jest.fn().mockResolvedValue({ id: "cus_new" }) },
      setupIntents: {
        create: jest.fn().mockResolvedValue({ client_secret: "seti_secret" }),
      },
      paymentMethods: {
        list: jest.fn(),
        retrieve: jest.fn(),
        detach: jest.fn(),
      },
    };
    service = Object.assign(Object.create(PaymentsService.prototype), {
      stripe,
      accounts: {
        findById: jest.fn().mockResolvedValue({ ...user, save: jest.fn() }),
      },
    });
  });
  it("sets up a card on the authenticated customer's Stripe account without charging", async () => {
    await expect(service.setupCard("owner")).resolves.toEqual({
      clientSecret: "seti_secret",
    });
    expect(stripe.setupIntents.create).toHaveBeenCalledWith({
      customer: "cus_owner",
      payment_method_types: ["card"],
      usage: "on_session",
      metadata: { userId: "owner" },
    });
    expect(stripe.customers.create).not.toHaveBeenCalled();
  });
  it("persists a new Stripe customer using an account-specific idempotency key", async () => {
    const account = {
      stripeCustomerId: undefined as string | undefined,
      save: jest.fn(),
    };
    Object.assign(service, {
      accounts: { findById: jest.fn().mockResolvedValue(account) },
    });
    await service.setupCard("owner");
    expect(stripe.customers.create).toHaveBeenCalledWith(
      { metadata: { userId: "owner" } },
      { idempotencyKey: "saved-cards:owner" },
    );
    expect(account.stripeCustomerId).toBe("cus_new");
    expect(account.save).toHaveBeenCalled();
  });
  it("returns only masked card metadata and scopes listing to the owner", async () => {
    stripe.paymentMethods.list.mockReturnValue(
      (async function* () {
        yield {
          id: "pm_1",
          billing_details: { name: "Private" },
          card: {
            brand: "visa",
            last4: "4242",
            exp_month: 12,
            exp_year: 2030,
            fingerprint: "private",
          },
        };
      })(),
    );
    await expect(service.savedCards("owner")).resolves.toEqual([
      { id: "pm_1", brand: "visa", last4: "4242", expMonth: 12, expYear: 2030 },
    ]);
    expect(stripe.paymentMethods.list).toHaveBeenCalledWith({
      customer: "cus_owner",
      type: "card",
      limit: 100,
    });
  });
  it("rejects removal of another customer's card", async () => {
    stripe.paymentMethods.retrieve.mockResolvedValue({ customer: "cus_other" });
    await expect(
      service.removeCard("owner", "pm_other"),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(stripe.paymentMethods.detach).not.toHaveBeenCalled();
  });
  it("removes an owned card", async () => {
    stripe.paymentMethods.retrieve.mockResolvedValue({
      customer: { id: "cus_owner" },
    });
    await expect(service.removeCard("owner", "pm_own")).resolves.toEqual({
      ok: true,
    });
    expect(stripe.paymentMethods.detach).toHaveBeenCalledWith("pm_own");
  });
  it("does not pretend to save cards when Stripe is unavailable", async () => {
    service.setStripeClient(null);
    await expect(service.setupCard("owner")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    await expect(service.savedCards("owner")).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});

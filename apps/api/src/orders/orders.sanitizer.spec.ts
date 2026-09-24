import { OrderStatus, PaymentMethod, PaymentStatus } from "../common/enums";
import { assertBlindIdentity, toCustomerView } from "./orders.sanitizer";

describe("toCustomerView blind identity", () => {
  it("never includes provider name/address/coords/logo/id", () => {
    const order = {
      _id: "507f1f77bcf86cd799439011",
      menuVersion: 1,
      lines: [
        {
          menuItemId: "507f1f77bcf86cd799439012",
          name: "Margherita",
          unitPriceCents: 899,
          quantity: 1,
        },
      ],
      subtotalCents: 899,
      deliveryFeeCents: 299,
      totalCents: 1198,
      status: OrderStatus.ACCEPTED_BY_PROVIDER,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.CAPTURED,
      addressId: "507f1f77bcf86cd799439013",
      providerId: "507f1f77bcf86cd799439014",
      providerName: "Secret Kitchen",
      providerAddress: "Hidden St 1",
      logoUrl: "https://example.com/logo.png",
      longitude: 11.57,
      latitude: 48.13,
      offers: [{ providerId: "507f1f77bcf86cd799439014", score: 0.9 }],
      notes: "extra cheese",
    };

    const view = toCustomerView(order);
    assertBlindIdentity(view);

    expect(view.providerId).toBeUndefined();
    expect(view.providerName).toBeUndefined();
    expect(view.providerAddress).toBeUndefined();
    expect(view.logoUrl).toBeUndefined();
    expect(view.longitude).toBeUndefined();
    expect(view.latitude).toBeUndefined();
    expect(view.offers).toBeUndefined();
    expect(view.customerStatus).toBe("kitchen");
    expect(view.totalCents).toBe(1198);
    expect(view.lines).toHaveLength(1);
  });

  it("maps EXCEPTION_REPORTED to safe kitchen customerStatus", () => {
    const view = toCustomerView({
      _id: "507f1f77bcf86cd799439021",
      menuVersion: 1,
      lines: [],
      subtotalCents: 0,
      deliveryFeeCents: 0,
      totalCents: 0,
      status: OrderStatus.EXCEPTION_REPORTED,
      paymentMethod: PaymentMethod.CARD,
      paymentStatus: PaymentStatus.CAPTURED,
      addressId: "507f1f77bcf86cd799439022",
      providerId: "507f1f77bcf86cd799439023",
    });
    assertBlindIdentity(view);
    expect(view.customerStatus).toBe("kitchen");
    expect(view.providerId).toBeUndefined();
  });
});

describe("customer journey projection", () => {
  it("counts actual views separately from invitations without exposing restaurants", () => {
    const view = toCustomerView({ status: OrderStatus.PENDING_OFFERS, offers: [
      { providerId: "private-a" },
      { providerId: "private-b", viewedAt: new Date() },
      { providerId: "private-c", respondedAt: new Date(), viewedAt: new Date() },
    ] });
    expect(view.matching).toEqual({ notified: 3, viewed: 2 });
    assertBlindIdentity(view);
    expect(JSON.stringify(view)).not.toContain("private-");
  });
  it.each([[OrderStatus.READY_FOR_PICKUP, "ready"], [OrderStatus.PICKED_UP, "picked_up"], [OrderStatus.ON_THE_WAY, "onway"]])("distinguishes %s", (status, stage) => {
    expect(toCustomerView({ status }).fulfillmentStage).toBe(stage);
  });
  it("hides matching statistics after confirmation", () => {
    expect(toCustomerView({ status: OrderStatus.ACCEPTED_BY_PROVIDER, offers: [] }).matching).toBeUndefined();
  });
});

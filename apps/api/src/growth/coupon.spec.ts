import { couponDiscount } from "./coupon";
import { GrowthService } from "./growth.module";
const offer = () => ({
  active: true,
  startAt: new Date("2026-01-01"),
  endAt: new Date("2027-01-01"),
  minSubtotalCents: 1000,
  maxDiscountCents: 500,
  kind: "percent" as const,
  value: 20,
});
describe("Coupon pricing", () => {
  it("uses integer cents and caps each order discount", () => {
    expect(couponDiscount(offer(), 1234, new Date("2026-09-01"))).toBe(246);
    expect(couponDiscount(offer(), 4000, new Date("2026-09-01"))).toBe(500);
  });
  it("rejects expired, paused, not-yet-active and minimum-spend failures", () => {
    expect(() =>
      couponDiscount(offer(), 500, new Date("2026-09-01")),
    ).toThrow();
    expect(() =>
      couponDiscount(offer(), 2000, new Date("2027-01-01")),
    ).toThrow();
    expect(() =>
      couponDiscount(offer(), 2000, new Date("2025-12-31")),
    ).toThrow();
    expect(() =>
      couponDiscount(
        { ...offer(), active: false },
        2000,
        new Date("2026-09-01"),
      ),
    ).toThrow();
  });
  it("never discounts beyond the pizza subtotal", () => {
    expect(
      couponDiscount(
        { ...offer(), kind: "fixed", value: 5000, maxDiscountCents: 5000 },
        1000,
        new Date("2026-09-01"),
      ),
    ).toBe(1000);
  });
  it("calculates a product-scoped discount from eligible products only", () => {
    expect(couponDiscount(offer(), 4000, new Date("2026-09-01"), 1200)).toBe(
      240,
    );
    expect(
      couponDiscount(
        { ...offer(), kind: "fixed", value: 2000 },
        4000,
        new Date("2026-09-01"),
        300,
      ),
    ).toBe(300);
  });
});

describe("Targeted coupon eligibility", () => {
  const service = (coupon: Record<string, unknown>) =>
    new GrowthService(
      { findOne: () => ({ exec: async () => coupon }) } as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
    );
  const targeted = {
    ...offer(),
    userScope: "specific",
    eligibleUserIds: ["customer-1"],
    productScope: "specific",
    eligibleProductIds: ["product-1"],
    minimumEligibleQuantity: 2,
  };
  const context = {
    userId: "customer-1",
    subtotalCents: 3000,
    lines: [
      {
        menuItemId: "item-1",
        productId: "product-1",
        unitPriceCents: 600,
        quantity: 2,
      },
      {
        menuItemId: "item-2",
        productId: "product-2",
        unitPriceCents: 1800,
        quantity: 1,
      },
    ],
  };

  it("discounts only matching products for an eligible customer", async () => {
    await expect(service(targeted).discount("TARGET20", context)).resolves.toBe(
      240,
    );
  });

  it("rejects other customers and carts without enough eligible products", async () => {
    await expect(
      service(targeted).discount("TARGET20", {
        ...context,
        userId: "customer-2",
      }),
    ).rejects.toThrow("not available for this account");
    await expect(
      service(targeted).discount("TARGET20", {
        ...context,
        lines: [{ ...context.lines[0]!, quantity: 1 }],
      }),
    ).rejects.toThrow("requires more eligible products");
  });
});

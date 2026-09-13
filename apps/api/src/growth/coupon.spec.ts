import { couponDiscount } from "./coupon";
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
});

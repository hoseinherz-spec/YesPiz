import assert from "node:assert/strict";
import { test } from "node:test";
import {
  couponSchema,
  fieldSchema,
  hoursSchema,
  passwordResetSchema,
  pizzaCustomizationSchema,
} from "./form-schemas";

test("field validation rejects blank required text, malformed email and invalid money", () => {
  assert.equal(
    fieldSchema({ required: true, minLength: 5 }).safeParse("     ").success,
    false,
  );
  assert.equal(
    fieldSchema({ type: "email" }).safeParse("a@invalid").success,
    false,
  );
  const money = fieldSchema({
    required: true,
    type: "number",
    min: 0,
    step: 0.01,
  });
  for (const invalid of ["", "-1", "NaN", "1.001"])
    assert.equal(money.safeParse(invalid).success, false);
  assert.equal(money.safeParse("12.50").success, true);
  assert.equal(
    fieldSchema({ type: "number", min: 1 }).safeParse("").success,
    true,
  );
});

test("consent, numeric codes and dates have Zod constraints", () => {
  assert.equal(
    fieldSchema({ type: "checkbox", required: true }).safeParse(false).success,
    false,
  );
  assert.equal(
    fieldSchema({ pattern: "[0-9]{6}", required: true }).safeParse("12ab56")
      .success,
    false,
  );
  assert.equal(
    fieldSchema({ type: "date" }).safeParse("2026-02-30").success,
    false,
  );
  assert.equal(fieldSchema({ type: "time" }).safeParse("25:00").success, false);
});

test("password confirmation is validated with the password", () => {
  for (const type of ["password", "text"]) {
    const schema = fieldSchema({
      type,
      autoComplete: "current-password",
      required: true,
      minLength: 8,
    });
    assert.equal(schema.safeParse(" secret ").success, true);
    assert.equal(schema.safeParse("short").success, false);
    assert.equal(schema.safeParse("").success, false);
  }
  assert.equal(
    passwordResetSchema.safeParse({
      password: "Password123!",
      confirmation: "other",
    }).success,
    false,
  );
  assert.equal(
    passwordResetSchema.safeParse({
      password: "Password123!",
      confirmation: "Password123!",
    }).success,
    true,
  );
});

test("coupons require chronological dates and an integer percentage up to 100", () => {
  const coupon = {
    code: "PIZZA10",
    name: "Pizza campaign",
    kind: "percent",
    value: "10",
    minimum: "0",
    cap: "20",
    start: "2026-09-01T10:00",
    end: "2026-09-30T10:00",
    userScope: "all",
    eligibleUserIds: [],
    productScope: "all",
    eligibleProductIds: [],
    minimumEligibleQuantity: "1",
  };
  assert.equal(couponSchema.safeParse(coupon).success, true);
  assert.equal(
    couponSchema.safeParse({ ...coupon, value: "100.1" }).success,
    false,
  );
  assert.equal(
    couponSchema.safeParse({ ...coupon, end: coupon.start }).success,
    false,
  );
  assert.equal(couponSchema.safeParse({ ...coupon, cap: "0" }).success, false);
  assert.equal(
    couponSchema.safeParse({
      ...coupon,
      productScope: "specific",
      eligibleProductIds: [],
    }).success,
    false,
  );
});

test("opening periods reject overlap, reverse time and invalid closures", () => {
  const hours = {
    timezone: "Europe/Vienna",
    periods: [{ day: 1, opens: "11:00", closes: "15:00" }],
    closedDates: [],
  };
  assert.equal(hoursSchema.safeParse(hours).success, true);
  assert.equal(
    hoursSchema.safeParse({
      ...hours,
      periods: [...hours.periods, { day: 1, opens: "14:00", closes: "16:00" }],
    }).success,
    false,
  );
  assert.equal(
    hoursSchema.safeParse({
      ...hours,
      periods: [{ day: 1, opens: "22:00", closes: "11:00" }],
    }).success,
    false,
  );
  assert.equal(
    hoursSchema.safeParse({ ...hours, closedDates: ["2026-02-30"] }).success,
    false,
  );
});

test("each active pizza size can fulfill required choices and has valid overrides", () => {
  const pizza = {
    variants: [
      { id: "small", name: "Small", priceCents: 1000, isActive: true },
      { id: "large", name: "Large", priceCents: 1400, isActive: true },
    ],
    groups: [
      {
        id: "dough",
        name: "Dough",
        min: 1,
        max: 1,
        options: [
          {
            id: "thin",
            name: "Thin",
            priceCents: 0,
            isActive: true,
            variantIds: [] as string[],
          },
        ],
      },
    ],
  };
  assert.equal(pizzaCustomizationSchema.safeParse(pizza).success, true);
  const unavailable = structuredClone(pizza);
  unavailable.groups[0]!.options[0]!.variantIds = ["small"];
  assert.equal(pizzaCustomizationSchema.safeParse(unavailable).success, false);
  const impossible = structuredClone(pizza);
  impossible.groups[0]!.min = 2;
  assert.equal(pizzaCustomizationSchema.safeParse(impossible).success, false);
  assert.equal(
    pizzaCustomizationSchema.safeParse({
      ...pizza,
      variants: pizza.variants.map((v) => ({ ...v, isActive: false })),
    }).success,
    false,
  );
});

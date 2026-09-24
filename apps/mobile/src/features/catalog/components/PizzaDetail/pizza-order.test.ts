import { test } from "node:test";
import assert from "node:assert/strict";
import { pizzaOptions } from "./pizza-order";
const config = {
  variants: [
    { id: "medium", name: "Medium", priceCents: 1000, isActive: true },
  ],
  groups: [
    {
      id: "toppings",
      name: "Toppings",
      min: 1,
      max: 2,
      options: [
        {
          id: "cheese",
          name: "Cheese",
          priceCents: 100,
          isActive: true,
          variantIds: [],
          priceOverrides: [{ variantId: "medium", priceCents: 175 }],
        },
        {
          id: "onion",
          name: "Onion",
          priceCents: 50,
          isActive: false,
          variantIds: [],
        },
        {
          id: "mushroom",
          name: "Mushroom",
          priceCents: 50,
          isActive: true,
          variantIds: ["large"],
        },
      ],
    },
  ],
};
test("required choices prevent adding an incomplete product", () => {
  assert.equal(pizzaOptions(config, "medium", []).valid, false);
  assert.equal(
    pizzaOptions(config, "missing", [
      { groupId: "toppings", optionIds: ["cheese"] },
    ]).valid,
    false,
  );
});
test("variant-specific option price is charged exactly once", () => {
  assert.deepEqual(
    pizzaOptions(config, "medium", [
      { groupId: "toppings", optionIds: ["cheese"] },
    ]),
    { valid: true, extraPrice: 1.75, labels: ["Cheese"] },
  );
});
test("inactive, incompatible and duplicate options cannot enter the cart", () => {
  for (const optionIds of [["onion"], ["mushroom"], ["cheese", "cheese"]]) {
    assert.equal(
      pizzaOptions(config, "medium", [{ groupId: "toppings", optionIds }])
        .valid,
      false,
    );
  }
});

import { Types } from "mongoose";
import { priceOrderItem, productOrderSnapshot } from "./order-item";
import type { MenuItemDocument } from "../catalog/schemas/menu.schema";
const item = (type = "pizza") =>
  ({
    id: "one",
    productType: type,
    priceCents: 1000,
    attributes: { shape: "round" },
    productId: new Types.ObjectId(),
    productRevisionId: new Types.ObjectId(),
    preparation: { mode: "cook", cookTimeSeconds: 90 },
  }) as unknown as MenuItemDocument;
describe("Product checkout rules and immutable order snapshots", () => {
  it("prices standard drinks without applying configured pizza size deltas", () => {
    const drink = item("drink");
    expect(
      priceOrderItem(
        drink,
        { menuItemId: "one", quantity: 1 },
        { mediumSizeDeltaCents: 900 },
      ).unitPriceCents,
    ).toBe(1000);
    expect(() =>
      priceOrderItem(
        drink,
        { menuItemId: "one", quantity: 1, size: "large" },
        {},
      ),
    ).toThrow("configured choices");
    expect(() =>
      priceOrderItem(
        drink,
        { menuItemId: "one", quantity: 1, extras: ["extra-cheese"] },
        {},
      ),
    ).toThrow("configured choices");
  });
  it("prices configured drink variants and rejects unavailable or forged choices", () => {
    const drink = item("drink");
    drink.customization = {
      variants: [
        { id: "330ml", name: "330 ml", priceCents: 250, isActive: true },
        { id: "500ml", name: "500 ml", priceCents: 400, isActive: false },
      ],
      groups: [],
    };
    expect(
      priceOrderItem(
        drink,
        { menuItemId: "one", quantity: 1, variantId: "330ml" },
        {},
      ).unitPriceCents,
    ).toBe(250);
    expect(() =>
      priceOrderItem(
        drink,
        { menuItemId: "one", quantity: 1, variantId: "500ml" },
        {},
      ),
    ).toThrow();
    expect(() =>
      priceOrderItem(
        drink,
        { menuItemId: "one", quantity: 1, variantId: "forged" },
        {},
      ),
    ).toThrow();
  });
  it("keeps pizza legacy pricing but disallows half pizza half drink", () => {
    expect(
      priceOrderItem(
        item(),
        { menuItemId: "one", quantity: 1, size: "large" },
        {},
      ).unitPriceCents,
    ).toBe(1300);
    expect(() =>
      priceOrderItem(
        item(),
        { menuItemId: "one", quantity: 1, secondHalfItemId: "two" },
        {},
        { ...item("drink"), id: "two" } as MenuItemDocument,
      ),
    ).toThrow("two different standard pizzas");
  });
  it("freezes product attributes, preparation and the second half at order time", () => {
    const pizza = item(),
      other = item();
    other.name = "Second half";
    const snapshot = productOrderSnapshot(pizza, undefined, other);
    pizza.attributes!.shape = "square";
    pizza.preparation!.cookTimeSeconds = 180;
    other.name = "Changed";
    expect(snapshot.attributes).toEqual({ shape: "round" });
    expect(snapshot.preparation!.cookTimeSeconds).toBe(90);
    expect(snapshot.secondHalf!.name).toBe("Second half");
  });
});

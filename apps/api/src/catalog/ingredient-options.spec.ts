import { customizeRecipe, priceIngredientChanges } from "./ingredient-options";
import { priceOrderItem } from "../orders/order-item";
import type { MenuItemDocument } from "./schemas/menu.schema";
const olive = {
  ingredientId: "507f1f77bcf86cd799439001",
  name: "Black olives",
  image: "/olive.png",
  includedByDefault: false,
  priceCents: 125,
  portionGrams: 12,
};
const cheese = {
  ...olive,
  ingredientId: "507f1f77bcf86cd799439002",
  name: "Cheese",
  includedByDefault: true,
  priceCents: 200,
  portionGrams: 30,
};
describe("Customer ingredient customization", () => {
  it("charges additions once, removes default ingredients without a refund, and snapshots names", () => {
    const result = priceIngredientChanges(
      [olive, cheese],
      [
        { ingredientId: olive.ingredientId, action: "add" },
        { ingredientId: cheese.ingredientId, action: "remove" },
      ],
    );
    expect(result.priceCents).toBe(125);
    expect(result.labels).toEqual(["Add Black olives", "No Cheese"]);
    const recipe = customizeRecipe(
      {
        ingredients: [
          { name: "Cheese", weightGrams: 60 },
          { name: "Dough", weightGrams: 200 },
        ],
        complete: true,
      },
      result.changes,
    );
    expect(recipe).toEqual({
      complete: true,
      ingredients: [
        { name: "Dough", weightGrams: 200 },
        { name: "Black olives", weightGrams: 12 },
      ],
    });
  });
  it("rejects fixed ingredients, duplicate operations and removing extras", () => {
    expect(() =>
      priceIngredientChanges(
        [],
        [{ ingredientId: olive.ingredientId, action: "add" }],
      ),
    ).toThrow("cannot be changed");
    expect(() =>
      priceIngredientChanges(
        [olive],
        [{ ingredientId: olive.ingredientId, action: "remove" }],
      ),
    ).toThrow();
    expect(() =>
      priceIngredientChanges(
        [olive],
        Array(2).fill({ ingredientId: olive.ingredientId, action: "add" }),
      ),
    ).toThrow("duplicate");
  });
  it("charges extra portions of default ingredients and preserves the original recipe", () => {
    const result = priceIngredientChanges([cheese], [{ ingredientId: cheese.ingredientId, action: "add" }]);
    expect(result.priceCents).toBe(200);
    const recipe = customizeRecipe({ ingredients: [{ name: "Cheese", weightGrams: 60 }], complete: true }, result.changes);
    expect(recipe.ingredients.reduce((total, item) => total + item.weightGrams, 0)).toBe(90);
  });
  it("adds ingredient prices to configured variants using the real checkout pricing function", () => {
    const item = {
      productType: "pizza",
      ingredientOptions: [olive],
      customization: {
        variants: [
          { id: "large", name: "Large", isActive: true, priceCents: 1500 },
        ],
        groups: [],
      },
    } as unknown as MenuItemDocument;
    expect(
      priceOrderItem(
        item,
        {
          menuItemId: "one",
          quantity: 1,
          variantId: "large",
          ingredientChanges: [
            { ingredientId: olive.ingredientId, action: "add" },
          ],
        },
        {},
      ).unitPriceCents,
    ).toBe(1625);
  });
  it("marks unmatched removals incomplete instead of reserving incorrect inventory", () => {
    const changes = priceIngredientChanges(
      [cheese],
      [{ ingredientId: cheese.ingredientId, action: "remove" }],
    ).changes;
    expect(
      customizeRecipe(
        { ingredients: [{ name: "Dough", weightGrams: 100 }], complete: true },
        changes,
      ).complete,
    ).toBe(false);
  });
});

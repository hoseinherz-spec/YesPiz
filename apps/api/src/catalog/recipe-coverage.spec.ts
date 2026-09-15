import { selectedRecipe } from "./recipe-coverage";
import { MenuItem } from "./schemas/menu.schema";
const item = {
  recipeIngredients: [{ name: "Dough", weightGrams: 200 }],
  recipeChoices: [
    {
      kind: "size",
      key: "large",
      ingredients: [{ name: "Dough", weightGrams: 320 }],
    },
    {
      kind: "extra",
      key: "Cheese",
      ingredients: [{ name: "Cheese", weightGrams: 40 }],
    },
  ],
} as MenuItem;
describe("Measured recipes", () => {
  it("does not guess stock for an uncovered size", () =>
    expect(selectedRecipe(item, "small", []).complete).toBe(false));
  it("uses measured size and adds measured extras", () =>
    expect(selectedRecipe(item, "large", ["Cheese"])).toEqual({
      complete: true,
      ingredients: [
        { name: "Dough", weightGrams: 320 },
        { name: "Cheese", weightGrams: 40 },
      ],
    }));
  it("blocks automatic inventory for uncovered extras", () =>
    expect(selectedRecipe(item, "medium", ["Olives"]).complete).toBe(false));
  it("retains the measured standard medium recipe", () =>
    expect(selectedRecipe(item, "medium", []).complete).toBe(true));
});

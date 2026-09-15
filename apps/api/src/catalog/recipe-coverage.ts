import type { MenuItem, RecipeIngredient } from "./schemas/menu.schema";
import type { PizzaSelection } from "./customization";
export type RecipeChoice = {
  kind: "size" | "extra" | "variant" | "option";
  key: string;
  ingredients: RecipeIngredient[];
};
/** Sizes and variants are full recipes. Extras/options add measured ingredients. */
export function selectedRecipe(
  item: MenuItem,
  size: string,
  extras: string[],
  variantId?: string,
  selections: PizzaSelection[] = [],
) {
  const rules = item.recipeChoices ?? [];
  const base = rules.find(
    (r) =>
      r.kind === (variantId ? "variant" : "size") &&
      r.key === (variantId || size),
  );
  let complete =
    !!base ||
    (!variantId &&
      size === "medium" &&
      (item.recipeIngredients?.length ?? 0) > 0);
  const ingredients = [...(base?.ingredients ?? item.recipeIngredients ?? [])];
  const additions = [
    ...extras.map((key) => ({ kind: "extra", key })),
    ...selections.flatMap((s) =>
      s.optionIds.map((id) => ({ kind: "option", key: `${s.groupId}/${id}` })),
    ),
  ];
  for (const addition of additions) {
    const rule = rules.find(
      (r) => r.kind === addition.kind && r.key === addition.key,
    );
    if (!rule) complete = false;
    else ingredients.push(...rule.ingredients);
  }
  return { ingredients, complete: complete && ingredients.length > 0 };
}

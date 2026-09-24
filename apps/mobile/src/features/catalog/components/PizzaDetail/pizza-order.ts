import type { PizzaCustomization, PizzaSelection } from "@repo/api";

export function pizzaOptions(
  config: PizzaCustomization | undefined,
  variantId: string,
  selections: PizzaSelection[],
) {
  if (!config) return { valid: true, extraPrice: 0, labels: [] as string[] };
  let valid = config.variants.some(
    (variant) => variant.id === variantId && variant.isActive,
  );
  let cents = 0;
  const labels: string[] = [];
  for (const group of config.groups) {
    const ids =
      selections.find((selection) => selection.groupId === group.id)
        ?.optionIds ?? [];
    const unique = [...new Set(ids)];
    valid &&=
      unique.length === ids.length &&
      ids.length >= group.min &&
      ids.length <= group.max;
    for (const id of unique) {
      const option = group.options.find(
        (option) =>
          option.id === id &&
          option.isActive &&
          (!option.variantIds.length || option.variantIds.includes(variantId)),
      );
      if (!option) {
        valid = false;
        continue;
      }
      cents +=
        option.priceOverrides?.find((price) => price.variantId === variantId)
          ?.priceCents ?? option.priceCents;
      labels.push(option.name);
    }
  }
  return { valid, extraPrice: cents / 100, labels };
}

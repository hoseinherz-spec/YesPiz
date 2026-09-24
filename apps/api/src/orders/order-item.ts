import { priceIngredientChanges } from "../catalog/ingredient-options";
import { BadRequestException } from "@nestjs/common";
import type { AppConfig } from "../app-config/schemas/app-config.schema";
import type { MenuItemDocument } from "../catalog/schemas/menu.schema";
import { priceCustomization } from "../catalog/customization";
import { productLinePrice } from "./pricing";
import type { OrderLineDto } from "./dto/order.dto";

export function priceOrderItem(
  item: MenuItemDocument,
  line: OrderLineDto,
  config: Partial<AppConfig>,
  secondHalf?: MenuItemDocument,
) {
  if (
    line.secondHalfItemId &&
    (!secondHalf ||
      item.productType !== "pizza" ||
      secondHalf.productType !== "pizza" ||
      item.customization ||
      secondHalf.customization ||
      line.secondHalfItemId === line.menuItemId)
  )
    throw new BadRequestException(
      "Choose two different standard pizzas for half & half.",
    );
  if (secondHalf && line.ingredientChanges?.length) throw new BadRequestException('Ingredient changes are not supported for half-and-half pizzas.');
  const ingredientSelection = priceIngredientChanges(item.ingredientOptions, line.ingredientChanges);
  const size = line.size ?? "medium";
  const extras = line.extras ?? [];
  if (
    (item.customization || item.productType !== "pizza") &&
    (extras.length || (line.size && line.size !== "medium"))
  )
    throw new BadRequestException("Use this product's configured choices.");
  if (!item.customization && (line.variantId || line.selections?.length))
    throw new BadRequestException(
      "This product does not accept those choices.",
    );
  const custom = item.customization
    ? priceCustomization(item.customization, line.variantId, line.selections)
    : undefined;
  const unitPriceCents =
    custom?.unitPriceCents ??
    productLinePrice(
      item.productType,
      secondHalf
        ? Math.round((item.priceCents + secondHalf.priceCents) / 2) + 100
        : item.priceCents,
      size,
      extras,
      config,
    );
  return { size, extras, custom, unitPriceCents: unitPriceCents + ingredientSelection.priceCents, ingredientSelection };
}
export function productOrderSnapshot(
  item: MenuItemDocument,
  variantId?: string,
  secondHalf?: MenuItemDocument,
) {
  // Clone mutable Mixed fields before handing them to order persistence.
  return JSON.parse(
    JSON.stringify({
      comboComponents: item.comboComponents,
      attributes: item.attributes ?? {},
      attributesSchemaVersion: item.attributesSchemaVersion ?? 1,
      variantName: item.customization?.variants.find((v) => v.id === variantId)
        ?.name,
      preparation: item.preparation,
      ...(secondHalf
        ? {
            secondHalf: {
              productId: secondHalf.productId,
              productRevisionId: secondHalf.productRevisionId,
              name: secondHalf.name,
              attributes: secondHalf.attributes ?? {},
              preparation: secondHalf.preparation,
            },
          }
        : {}),
    }),
  ) as NonNullable<
    import("./schemas/order.schema").OrderLine["productSnapshot"]
  >;
}

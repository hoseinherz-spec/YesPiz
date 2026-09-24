import { BadRequestException } from "@nestjs/common";
import { resolveCombo } from "../catalog/combo";
import type { MenuItemDocument } from "../catalog/schemas/menu.schema";
import type { OrderLineDto } from "./dto/order.dto";

/** Expand into real kitchen items. Distribute cents exactly, including uneven totals. */
export function expandComboLines(
  lines: OrderLineDto[],
  items: MenuItemDocument[],
  components: MenuItemDocument[],
) {
  return lines.flatMap((line) => {
    const combo = items.find((item) => item.id === line.menuItemId);
    if (combo?.productType !== "combo")
      return [
        {
          line,
          combo: undefined as MenuItemDocument | undefined,
          comboPriceCents: undefined as number | undefined,
        },
      ];
    if (
      line.secondHalfItemId ||
      line.variantId ||
      line.selections?.length ||
      line.extras?.length ||
      line.ingredientChanges?.length ||
      (line.size && line.size !== "medium")
    )
      throw new BadRequestException(
        "Combo contents are fixed. Choose another combo to change the products.",
      );
    const choices = resolveCombo(combo.comboComponents ?? [], components);
    const count = choices.reduce((n, c) => n + c.quantity, 0);
    const base = Math.floor(combo.priceCents / count);
    let remainder = combo.priceCents % count;
    return choices.flatMap((c) => {
      const extra = Math.min(remainder, c.quantity);
      remainder -= extra;
      return [
        { quantity: extra, price: base + 1 },
        { quantity: c.quantity - extra, price: base },
      ]
        .filter((part) => part.quantity > 0)
        .map((part) => ({
          line: {
            menuItemId: c.menuItemId,
            quantity: part.quantity * line.quantity,
            size: c.size,
            variantId: c.variantId,
          } as OrderLineDto,
          combo,
          comboPriceCents: part.price,
        }));
    });
  });
}

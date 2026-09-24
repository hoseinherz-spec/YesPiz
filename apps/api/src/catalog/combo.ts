import { BadRequestException } from "@nestjs/common";
import { Type } from "class-transformer";
import {
  IsIn,
  IsInt,
  IsMongoId,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";
import type { MenuItem } from "./schemas/menu.schema";

export class ComboComponentDto {
  @IsMongoId() menuItemId!: string;
  @IsOptional() @IsIn(["small", "medium", "large"]) size?:
    "small" | "medium" | "large";
  @IsOptional() @IsString() variantId?: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(20) quantity!: number;
}
export type ComboComponent = ComboComponentDto & {
  name: string;
  sizeName: string;
  imageUrl?: string;
  productId?: string;
  productRevisionId?: string;
};
export function resolveCombo(
  choices: ComboComponentDto[],
  items: Array<MenuItem & { id?: string }>,
): ComboComponent[] {
  if (
    !Array.isArray(choices) ||
    choices.length < 1 ||
    choices.length > 12 ||
    choices.reduce((n, c) => n + c.quantity, 0) < 2
  )
    throw new BadRequestException(
      "A combo needs at least two products and at most 12 selections.",
    );
  return choices.map((choice) => {
    const item = items.find((i) => i.id === choice.menuItemId);
    if (
      !item ||
      !item.isActive ||
      item.deletedAt ||
      ["combo", "unclassified"].includes(item.productType)
    )
      throw new BadRequestException(
        "Choose available products from this menu.",
      );
    if (
      !Number.isInteger(choice.quantity) ||
      choice.quantity < 1 ||
      choice.quantity > 20
    )
      throw new BadRequestException("Choose a quantity between 1 and 20.");
    const variant = item.customization?.variants.find(
      (v) => v.id === choice.variantId && v.isActive,
    );
    if (
      item.customization &&
      (!variant || item.customization.groups.some((g) => g.min > 0))
    )
      throw new BadRequestException(
        "Choose an active size. Products with required extra choices cannot be included.",
      );
    if (
      (!item.customization && choice.variantId) ||
      (item.customization && choice.size) ||
      (!item.customization &&
        item.productType !== "pizza" &&
        choice.size &&
        choice.size !== "medium")
    )
      throw new BadRequestException("Invalid product size.");
    return {
      menuItemId: choice.menuItemId,
      quantity: choice.quantity,
      ...(variant
        ? { variantId: variant.id }
        : { size: choice.size ?? "medium" }),
      name: item.name,
      sizeName:
        variant?.name ??
        (item.productType === "pizza" ? (choice.size ?? "medium") : "Standard"),
      imageUrl: item.imageUrl,
      productId: item.productId?.toString(),
      productRevisionId: item.productRevisionId?.toString(),
    };
  });
}

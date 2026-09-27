import { BadRequestException } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsInt,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsIn,
} from "class-validator";
export class IngredientOptionDto {
  @ApiProperty() @IsMongoId() ingredientId!: string;
  @ApiProperty() @IsInt() @Min(0) @Max(100000) priceCents!: number;
  @ApiProperty() @IsNumber() @Min(0.1) @Max(1000) portionGrams!: number;
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  toppingImageUrl?: string;
}
export type IngredientOption = IngredientOptionDto & {
  name: string;
  image: string;
  includedByDefault: boolean;
};
export class IngredientChangeDto {
  @ApiProperty() @IsMongoId() ingredientId!: string;
  @ApiProperty({ enum: ["add", "remove"] }) @IsIn(["add", "remove"]) action!:
    "add" | "remove";
}
export function validateToppingImage(url?: string) {
  if (
    url !== undefined &&
    (typeof url !== "string" ||
      (url !== "" && !/^(https?:\/\/|\/(?!\/))/.test(url)))
  )
    throw new BadRequestException(
      "Use an HTTP(S) image URL or an application path.",
    );
  return url;
}
export function priceIngredientChanges(
  options: IngredientOption[] = [],
  changes: IngredientChangeDto[] = [],
) {
  if (
    !Array.isArray(changes) ||
    changes.length > 40 ||
    new Set(changes.map((c) => c?.ingredientId)).size !== changes.length
  )
    throw new BadRequestException("Invalid or duplicate ingredient changes.");
  let priceCents = 0;
  const labels: string[] = [];
  const normalized = changes
    .map((change) => {
      const option = options.find(
        (o) => o.ingredientId === change?.ingredientId,
      );
      if (
        !option ||
        (change.action !== "add" && !(option.includedByDefault && change.action === "remove"))
      )
        throw new BadRequestException(
          "This ingredient cannot be changed on this product.",
        );
      if (change.action === "add") priceCents += option.priceCents;
      labels.push(`${change.action === "add" ? "Add" : "No"} ${option.name}`);
      return {
        ingredientId: option.ingredientId,
        action: change.action,
        name: option.name,
        portionGrams: option.portionGrams,
      };
    })
    .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId));
  return { priceCents, labels, changes: normalized };
}
export function customizeRecipe(
  recipe: {
    ingredients: { name: string; weightGrams: number }[];
    complete: boolean;
  },
  changes: ReturnType<typeof priceIngredientChanges>["changes"],
) {
  let ingredients = recipe.ingredients.map((i) => ({ ...i }));
  let complete = recipe.complete;
  for (const change of changes) {
    if (change.action === "add")
      ingredients.push({ name: change.name, weightGrams: change.portionGrams });
    else {
      const key = change.name.trim().toLowerCase();
      const matches = ingredients.filter(
        (i) => i.name.trim().toLowerCase() === key,
      );
      if (!matches.length) complete = false;
      // Removing a default ingredient removes it completely, including variant-dependent quantities.
      ingredients = ingredients.filter(
        (i) => i.name.trim().toLowerCase() !== key,
      );
    }
  }
  return { ingredients, complete };
}

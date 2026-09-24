import type { MenuItem } from "../schemas/menu.schema";
import type { ProductContent } from "./product.dto";
import type { ProductRevisionDocument } from "./product.schema";
/** Materialized compatibility view. New product content is owned by immutable revisions. */
export function productProjection(revision: ProductRevisionDocument) {
  const c = revision.content;
  const p = c.preparation!;
  return {
    productId: revision.productId,
    productRevisionId: revision._id,
    productType: revision.type,
    name: c.name,
    description: c.description ?? "",
    imageUrl: c.imageUrl,
    ingredientIds: c.ingredientIds ?? [],
    ingredients: c.ingredients ?? [],
    allergens: c.allergens ?? [],
    tags: c.tags ?? [],
    attributes: c.attributes ?? {},
    attributesSchemaVersion: revision.attributesSchemaVersion,
    preparation: p,
    prepWeight: p.prepWeight,
    cookTimeSeconds: p.cookTimeSeconds,
    handoffTempC: p.handoffTempC,
    requiresNumberedSeal: p.requiresNumberedSeal,
    requiresReadyPhoto: p.requiresReadyPhoto,
    checklistTemplate: p.checklistTemplate,
    recipeIngredients: p.recipeIngredients,
    recipeChoices: c.recipeChoices ?? [],
  };
}
export function legacyProductContent(
  item: Partial<MenuItem> & { name: string },
): ProductContent {
  return {
    name: item.name,
    description: item.description ?? "",
    imageUrl: item.imageUrl,
    gallery: item.presentation?.gallery ?? [],
    ingredientIds: (item.ingredientIds ?? []).map(String),
    ingredients: item.ingredients ?? [],
    allergens: item.allergens ?? [],
    tags: item.tags ?? [],
    attributes: item.attributes ?? {},
    attributesSchemaVersion: item.attributesSchemaVersion ?? 1,
    preparation: item.preparation ?? {
      mode: item.productType === "drink" ? "pack" : "cook",
      prepWeight: item.prepWeight ?? 1,
      cookTimeSeconds: item.cookTimeSeconds ?? 0,
      handoffTempC:
        item.handoffTempC ?? (item.productType === "drink" ? 0 : 65),
      requiresNumberedSeal: item.requiresNumberedSeal ?? true,
      requiresReadyPhoto: item.requiresReadyPhoto ?? false,
      checklistTemplate:
        item.checklistTemplate ??
        (item.productType === "drink"
          ? ["Packaging seal"]
          : ["Weight check", "Packaging seal", "Temperature"]),
      recipeIngredients: item.recipeIngredients ?? [],
    },
    recipeChoices: item.recipeChoices ?? [],
  };
}
export const productContentKeys = [
  "name",
  "description",
  "imageUrl",
  "ingredientIds",
  "ingredients",
  "allergens",
  "tags",
  "attributes",
  "attributesSchemaVersion",
  "prepWeight",
  "cookTimeSeconds",
  "handoffTempC",
  "requiresNumberedSeal",
  "requiresReadyPhoto",
  "checklistTemplate",
  "recipeIngredients",
] as const;

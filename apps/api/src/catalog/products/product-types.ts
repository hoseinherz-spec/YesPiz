import { BadRequestException } from "@nestjs/common";

export type AttributeRule = {
  type: "string" | "number" | "boolean";
  values?: readonly string[];
  min?: number;
  max?: number;
};
export type ProductTypeDefinition = {
  schemaVersion: number;
  attributes: Record<string, AttributeRule>;
  preparation: "cook" | "assemble" | "pack";
};
/** Add a definition here to support another food without changing CRUD or checkout. */
export const productTypes: Record<string, ProductTypeDefinition> = {
  combo: { schemaVersion: 1, preparation: "assemble", attributes: {} },
  pizza: {
    schemaVersion: 1,
    preparation: "cook",
    attributes: {
      shape: {
        type: "string",
        values: ["round", "square", "rectangle", "oval"],
      },
      doughThickness: { type: "string", values: ["thin", "medium", "thick"] },
      baseCrispiness: {
        type: "string",
        values: ["soft", "lightly_crispy", "crispy", "extra_crispy"],
      },
      innerTexture: {
        type: "string",
        values: ["soft", "airy", "chewy", "dense"],
      },
      crustType: {
        type: "string",
        values: ["thin", "puffy", "stuffed", "none"],
      },
      spiceLevel: { type: "number", min: 0, max: 3 },
    },
  },
  drink: {
    schemaVersion: 1,
    preparation: "pack",
    attributes: {
      volumeMl: { type: "number", min: 1, max: 10000 },
      carbonated: { type: "boolean" },
      servingTemperature: {
        type: "string",
        values: ["cold", "ambient", "hot"],
      },
    },
  },
  burger: {
    schemaVersion: 1,
    preparation: "cook",
    attributes: {
      bunType: {
        type: "string",
        values: ["plain", "sesame", "brioche", "wholegrain", "lettuce"],
      },
      pattyCount: { type: "number", min: 1, max: 10 },
      pattyWeightGrams: { type: "number", min: 1, max: 1000 },
    },
  },
};
export function validateAttributes(
  type: string,
  attributes: Record<string, unknown> = {},
  schemaVersion = 1,
) {
  const definition = Object.prototype.hasOwnProperty.call(productTypes, type)
    ? productTypes[type]
    : undefined;
  if (!definition || definition.schemaVersion !== schemaVersion)
    throw new BadRequestException(
      "Unsupported product type or attributes schema version.",
    );
  if (
    !attributes ||
    typeof attributes !== "object" ||
    Array.isArray(attributes)
  )
    throw new BadRequestException("Product attributes must be an object.");
  for (const [key, value] of Object.entries(attributes)) {
    const rule = Object.prototype.hasOwnProperty.call(
      definition.attributes,
      key,
    )
      ? definition.attributes[key]
      : undefined;
    if (
      !rule ||
      typeof value !== rule.type ||
      (rule.values && !rule.values.includes(value as string)) ||
      (typeof value === "number" &&
        (!Number.isFinite(value) ||
          (rule.min !== undefined && value < rule.min) ||
          (rule.max !== undefined && value > rule.max)))
    )
      throw new BadRequestException(`Invalid ${type} attribute: ${key}.`);
  }
  return { ...attributes };
}

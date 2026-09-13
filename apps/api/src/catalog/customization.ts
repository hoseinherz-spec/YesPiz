import { BadRequestException } from "@nestjs/common";

export type PizzaVariant = {
  id: string;
  name: string;
  priceCents: number;
  isActive: boolean;
};
export type PizzaOption = {
  id: string;
  name: string;
  priceCents: number;
  isActive: boolean;
  variantIds: string[];
  priceOverrides?: Array<{ variantId: string; priceCents: number }>;
};
export type PizzaOptionGroup = {
  id: string;
  name: string;
  min: number;
  max: number;
  options: PizzaOption[];
};
export type PizzaCustomization = {
  variants: PizzaVariant[];
  groups: PizzaOptionGroup[];
};
export type PizzaSelection = { groupId: string; optionIds: string[] };

const fail = (message: string): never => {
  throw new BadRequestException(message);
};
const id = (v: unknown) =>
  typeof v === "string" && /^[a-zA-Z0-9_-]{1,60}$/.test(v);
const label = (v: unknown) =>
  typeof v === "string" && v.trim().length > 0 && v.length <= 120;
const money = (v: unknown) =>
  Number.isInteger(v) && Number(v) >= 0 && Number(v) <= 1_000_000;
const unique = (values: string[]) => new Set(values).size === values.length;

/** Validate persisted admin configuration as well as incoming requests. */
export function validateCustomization(value: PizzaCustomization) {
  if (
    !value ||
    !Array.isArray(value.variants) ||
    !Array.isArray(value.groups) ||
    value.variants.length < 1 ||
    value.variants.length > 20 ||
    value.groups.length > 20
  )
    fail("Provide 1–20 variants and at most 20 option groups.");
  if (
    value.variants.some((v) => !v || typeof v !== "object") ||
    value.groups.some((g) => !g || typeof g !== "object")
  )
    fail("Invalid pizza configuration.");
  if (
    !unique(value.variants.map((v) => v.id)) ||
    !unique(value.groups.map((g) => g.id))
  )
    fail("Variant and group identifiers must be unique.");
  for (const v of value.variants)
    if (
      !id(v.id) ||
      !label(v.name) ||
      !money(v.priceCents) ||
      typeof v.isActive !== "boolean"
    )
      fail("Invalid pizza variant.");
  if (!value.variants.some((v) => v.isActive))
    fail("At least one pizza variant must be available.");
  for (const g of value.groups) {
    if (
      !id(g.id) ||
      !label(g.name) ||
      !Number.isInteger(g.min) ||
      !Number.isInteger(g.max) ||
      g.min < 0 ||
      g.max < Math.max(1, g.min) ||
      g.max > 30 ||
      !Array.isArray(g.options) ||
      g.options.length > 30 ||
      g.options.some((o) => !o || typeof o !== "object") ||
      !unique(g.options.map((o) => o.id))
    )
      fail("Invalid option group or selection limits.");
    for (const o of g.options) {
      if (
        !id(o.id) ||
        !label(o.name) ||
        !money(o.priceCents) ||
        typeof o.isActive !== "boolean" ||
        !Array.isArray(o.variantIds) ||
        !unique(o.variantIds) ||
        o.variantIds.some((v) => !value.variants.some((x) => x.id === v))
      )
        fail("Invalid option or variant restriction.");
    }
    for (const o of g.options) {
      if (
        o.priceOverrides &&
        (!Array.isArray(o.priceOverrides) ||
          o.priceOverrides.length > 20 ||
          o.priceOverrides.some(
            (x) =>
              !x ||
              !value.variants.some((v) => v.id === x.variantId) ||
              !money(x.priceCents),
          ) ||
          !unique(o.priceOverrides.map((x) => x.variantId)))
      )
        fail("Invalid price override.");
    }
    for (const v of value.variants.filter((v) => v.isActive)) {
      if (
        g.options.filter(
          (o) =>
            o.isActive && (!o.variantIds.length || o.variantIds.includes(v.id)),
        ).length < g.min
      )
        fail(`The required choices in ${g.name} cannot be met for ${v.name}.`);
    }
  }
  // Copy only documented public fields, never persist arbitrary properties.
  return {
    variants: value.variants.map(({ id, name, priceCents, isActive }) => ({
      id,
      name: name.trim(),
      priceCents,
      isActive,
    })),
    groups: value.groups.map(({ id, name, min, max, options }) => ({
      id,
      name: name.trim(),
      min,
      max,
      options: options.map(
        ({ id, name, priceCents, isActive, variantIds, priceOverrides }) => ({
          id,
          name: name.trim(),
          priceCents,
          isActive,
          variantIds,
          ...(priceOverrides
            ? {
                priceOverrides: priceOverrides.map(
                  ({ variantId, priceCents }) => ({ variantId, priceCents }),
                ),
              }
            : {}),
        }),
      ),
    })),
  };
}

export function priceCustomization(
  config: PizzaCustomization,
  variantId: string | undefined,
  selections: PizzaSelection[] = [],
) {
  const variant = config.variants.find((v) => v.id === variantId && v.isActive);
  if (!variant) fail("Choose an available pizza variant.");
  if (
    !Array.isArray(selections) ||
    selections.length > 20 ||
    selections.some((s) => !s || typeof s !== "object") ||
    !unique(selections.map((s) => s.groupId)) ||
    selections.some((s) => !config.groups.some((g) => g.id === s.groupId))
  )
    fail("Unknown or duplicate option group.");
  let unitPriceCents = variant!.priceCents;
  const labels: string[] = [variant!.name];
  const normalized: PizzaSelection[] = [];
  for (const group of config.groups) {
    const selected =
      selections.find((s) => s.groupId === group.id)?.optionIds ?? [];
    if (
      !Array.isArray(selected) ||
      !unique(selected) ||
      selected.length < group.min ||
      selected.length > group.max
    )
      fail(`Choose ${group.min}–${group.max} options for ${group.name}.`);
    for (const optionId of selected) {
      const option = group.options.find(
        (o) =>
          o.id === optionId &&
          o.isActive &&
          (!o.variantIds.length || o.variantIds.includes(variant!.id)),
      );
      if (!option) fail(`An option in ${group.name} is unavailable.`);
      unitPriceCents +=
        option!.priceOverrides?.find((p) => p.variantId === variant!.id)
          ?.priceCents ?? option!.priceCents;
      labels.push(`${group.name}: ${option!.name}`);
    }
    if (selected.length)
      normalized.push({ groupId: group.id, optionIds: [...selected].sort() });
  }
  return {
    unitPriceCents,
    variantId: variant!.id,
    selections: normalized,
    selectionLabels: labels,
  };
}

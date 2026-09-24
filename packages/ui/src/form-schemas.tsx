import { z } from "zod";

const name = z.string().trim().min(1).max(120);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,60}$/);
const cents = z.number().int().min(0).max(1_000_000);
const unique = (values: string[]) => new Set(values).size === values.length;
export const pizzaCustomizationSchema = z
  .object({
    variants: z
      .array(z.object({ id, name, priceCents: cents, isActive: z.boolean() }))
      .min(1)
      .max(20),
    groups: z
      .array(
        z.object({
          id,
          name,
          min: z.number().int().min(0).max(30),
          max: z.number().int().min(1).max(30),
          options: z
            .array(
              z.object({
                id,
                name,
                priceCents: cents,
                isActive: z.boolean(),
                variantIds: z.array(id),
                priceOverrides: z
                  .array(z.object({ variantId: id, priceCents: cents }))
                  .max(20)
                  .optional(),
              }),
            )
            .max(30),
        }),
      )
      .max(20),
  })
  .superRefine((pizza, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (!pizza.variants.some((v) => v.isActive))
      fail("At least one pizza size must be available.");
    if (
      !unique(pizza.variants.map((v) => v.id)) ||
      !unique(pizza.groups.map((g) => g.id))
    )
      fail("Size and group identifiers must be unique.");
    for (const group of pizza.groups) {
      if (group.min > group.max)
        fail(`${group.name}: minimum choices cannot exceed maximum.`);
      if (!unique(group.options.map((o) => o.id)))
        fail(`${group.name}: option identifiers must be unique.`);
      for (const option of group.options) {
        if (
          !unique(option.variantIds) ||
          option.variantIds.some((v) => !pizza.variants.some((x) => x.id === v))
        )
          fail(`${option.name}: invalid size restrictions.`);
        if (
          option.priceOverrides &&
          (!unique(option.priceOverrides.map((p) => p.variantId)) ||
            option.priceOverrides.some(
              (p) => !pizza.variants.some((v) => v.id === p.variantId),
            ))
        )
          fail(`${option.name}: invalid price overrides.`);
      }
      for (const variant of pizza.variants.filter((v) => v.isActive)) {
        if (
          group.options.filter(
            (o) =>
              o.isActive &&
              (!o.variantIds.length || o.variantIds.includes(variant.id)),
          ).length < group.min
        )
          fail(
            `${group.name}: required choices cannot be met for ${variant.name}.`,
          );
      }
    }
  });

const time = z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/);
const period = z.object({
  day: z.number().int().min(0).max(6),
  opens: time,
  closes: time,
});
const date = z
  .string()
  .refine(
    (v) =>
      /^\d{4}-\d{2}-\d{2}$/.test(v) &&
      Number.isFinite(Date.parse(v)) &&
      new Date(v).toISOString().slice(0, 10) === v,
    "Enter a valid date (YYYY-MM-DD).",
  );
export const hoursSchema = z
  .object({
    timezone: z.string().refine((v) => {
      try {
        new Intl.DateTimeFormat("en", { timeZone: v });
        return true;
      } catch {
        return false;
      }
    }, "Choose a valid IANA timezone."),
    periods: z.array(period),
    closedDates: z.array(date),
  })
  .superRefine(({ periods }, ctx) => {
    for (let i = 0; i < periods.length; i++) {
      const a = periods[i]!;
      if (a.opens >= a.closes)
        ctx.addIssue({
          code: "custom",
          message:
            "Each period must end after it starts. Split overnight hours at midnight.",
        });
      if (
        periods
          .slice(i + 1)
          .some(
            (b) => a.day === b.day && a.opens < b.closes && b.opens < a.closes,
          )
      )
        ctx.addIssue({
          code: "custom",
          message: "Opening periods cannot overlap.",
        });
    }
  });
const image = z
  .string()
  .refine(
    (s) =>
      /^\/(?!\/)/.test(s) ||
      z.url({ protocol: /^https?$/ }).safeParse(s).success,
    "Use an http(s) image URL or a local image path.",
  );
export const pizzaPresentationSchema = z.object({
  gallery: z.array(image).max(12),
  fields: z
    .array(
      z
        .object({
          name,
          type: z.enum(["text", "number", "boolean"]),
          value: z.string().max(2000),
          visibility: z.enum(["public", "internal"]),
        })
        .superRefine((f, ctx) => {
          if (
            f.type === "number" &&
            (!f.value.trim() || !Number.isFinite(Number(f.value)))
          )
            ctx.addIssue({
              code: "custom",
              message: `${f.name}: enter a valid number.`,
            });
          if (f.type === "boolean" && !["true", "false"].includes(f.value))
            ctx.addIssue({
              code: "custom",
              message: `${f.name}: select true or false.`,
            });
        }),
    )
    .max(40),
  availability: hoursSchema.and(z.object({ enabled: z.boolean() })),
});
export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .regex(/^[A-Z0-9-]{3,32}$/),
    name: z.string().trim().min(3).max(100),
    kind: z.enum(["fixed", "percent"]),
    value: z.string().trim().min(1),
    minimum: z.string().trim().min(1),
    cap: z.string().trim().min(1),
    start: z.string().min(1),
    end: z.string().min(1),
    userScope: z.enum(["all", "specific"]),
    eligibleUserIds: z.array(z.string()),
    productScope: z.enum(["all", "specific"]),
    eligibleProductIds: z.array(z.string()),
    minimumEligibleQuantity: z.string().trim().min(1),
  })
  .superRefine((v, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    if (
      !Number.isFinite(Number(v.value)) ||
      Number(v.value) <= 0 ||
      (v.kind === "percent" &&
        (!Number.isInteger(Number(v.value)) || Number(v.value) > 100))
    )
      fail(
        "Percentage must be a whole number from 1 to 100; fixed discounts must be positive.",
      );
    if (
      !Number.isFinite(Number(v.minimum)) ||
      Number(v.minimum) < 0 ||
      !Number.isFinite(Number(v.cap)) ||
      Number(v.cap) <= 0
    )
      fail(
        "Minimum subtotal must be non-negative and the discount cap must be positive.",
      );
    if (
      !Number.isFinite(Date.parse(v.start)) ||
      !Number.isFinite(Date.parse(v.end)) ||
      Date.parse(v.end) <= Date.parse(v.start)
    )
      fail("The discount must end after it starts.");
    if (
      !Number.isInteger(Number(v.minimumEligibleQuantity)) ||
      Number(v.minimumEligibleQuantity) < 1 ||
      Number(v.minimumEligibleQuantity) > 99
    )
      fail("Minimum eligible product quantity must be from 1 to 99.");
    if (v.userScope === "specific" && v.eligibleUserIds.length === 0)
      fail("Select at least one eligible customer.");
    if (v.productScope === "specific" && v.eligibleProductIds.length === 0)
      fail("Select at least one eligible product.");
  });

export const passwordResetSchema = z
  .object({ password: z.string().min(8).max(128), confirmation: z.string() })
  .refine((v) => v.password === v.confirmation, "Passwords must match.");

export type Rules = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  type?: string;
  autoComplete?: string;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  disabled?: boolean;
  schema?: z.ZodType;
};
/** Constraints are expressed once on the field and evaluated by Zod, never just HTML. */
export function fieldSchema(rules: Rules): z.ZodType {
  if (rules.disabled) return z.unknown();
  if (rules.schema) return rules.schema;
  if (rules.type === "checkbox")
    return rules.required
      ? z.literal(true, { error: "Please confirm this field." })
      : z.boolean();
  return z.string().superRefine((value, ctx) => {
    const fail = (message: string) => ctx.addIssue({ code: "custom", message });
    const isPassword =
      rules.type === "password" || rules.autoComplete?.includes("password");
    const text = isPassword ? value : value.trim();
    if (!text) {
      if (rules.required) fail("This field is required.");
      return;
    }
    if (rules.minLength !== undefined && text.length < rules.minLength)
      fail(`Use at least ${rules.minLength} characters.`);
    if (rules.maxLength !== undefined && value.length > rules.maxLength)
      fail(`Use at most ${rules.maxLength} characters.`);
    if (rules.type === "email" && !z.email().safeParse(value.trim()).success)
      fail("Enter a valid email address.");
    if (
      rules.type === "url" &&
      !z.url({ protocol: /^https?$/ }).safeParse(value).success
    )
      fail("Enter an http or https URL.");
    if (rules.pattern && !new RegExp(`^(?:${rules.pattern})$`, "u").test(value))
      fail("Use the requested format.");
    if (rules.type === "number") {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        fail("Enter a valid number.");
        return;
      }
      if (rules.min !== undefined && n < Number(rules.min))
        fail(`Minimum: ${rules.min}.`);
      if (rules.max !== undefined && n > Number(rules.max))
        fail(`Maximum: ${rules.max}.`);
      const step = rules.step === "any" ? 0 : Number(rules.step ?? 1);
      const increments = (n - Number(rules.min ?? 0)) / step;
      if (step > 0 && Math.abs(increments - Math.round(increments)) > 1e-7)
        fail(`Use increments of ${step}.`);
    }
    if (["date", "datetime-local", "time"].includes(rules.type ?? "")) {
      if (rules.type === "date" && !z.iso.date().safeParse(value).success)
        fail("Enter a valid date.");
      if (
        rules.type === "time" &&
        !/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/.test(value)
      )
        fail("Enter a valid time.");
      if (
        rules.type === "datetime-local" &&
        !Number.isFinite(Date.parse(value))
      )
        fail("Enter a valid date and time.");
      if (rules.min !== undefined && value < String(rules.min))
        fail(`Choose ${rules.min} or later.`);
      if (rules.max !== undefined && value > String(rules.max))
        fail(`Choose ${rules.max} or earlier.`);
    }
  });
}

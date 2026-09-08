import type { AppConfig } from "../app-config/schemas/app-config.schema";
export function pricingOptions(config: Partial<AppConfig>) {
  return {
    deliveryFeeCents: config.deliveryFeeCents ?? 299,
    sizes: {
      small: config.smallSizeDeltaCents ?? -200,
      medium: config.mediumSizeDeltaCents ?? 0,
      large: config.largeSizeDeltaCents ?? 300,
    },
    extras: {
      "extra-cheese": config.extraCheeseCents ?? 150,
      jalapenos: config.jalapenosCents ?? 100,
      olives: config.olivesCents ?? 100,
      "garlic-dip": config.garlicDipCents ?? 90,
    } as Record<string, number>,
  };
}
export function linePrice(
  base: number,
  size: "small" | "medium" | "large",
  extras: string[],
  config: Partial<AppConfig>,
) {
  const pricing = pricingOptions(config);
  return (
    Math.max(0, base + pricing.sizes[size]) +
    extras.reduce((sum, extra) => sum + (pricing.extras[extra] ?? 0), 0)
  );
}

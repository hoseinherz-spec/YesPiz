import type { PublicPizzaPresentation } from "@repo/api";

export function reviewMetrics(presentation?: PublicPizzaPresentation) {
  const read = (names: string[]) => {
    const field = presentation?.fields.find(({ name }) =>
      names.includes(name.toLowerCase().replace(/[^a-z]/g, "")),
    );
    if (!field?.value.trim()) return null;
    const value = Number(field.value);
    return Number.isFinite(value) && value >= 0 ? value : null;
  };
  const rating = read(["rating", "averagerating", "reviewrating"]);
  const count = read(["reviewcount", "reviewscount", "reviews", "ratingcount"]);
  return {
    rating: rating !== null && rating <= 5 ? rating : null,
    reviewCount: count !== null && Number.isInteger(count) ? count : null,
  };
}

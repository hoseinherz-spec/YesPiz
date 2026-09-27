"use client";

import {
  usePublishedMenuQuery,
  type PublishedMenuItem,
  type Ingredient,
  type IngredientOption,
  type PizzaCustomization,
  type PublicPizzaPresentation,
} from "@repo/api";
import { useMemo } from "react";

import { PIZZAS, type Pizza } from "@/constants/pizzas";

export type CatalogPizza = Pizza & {
  attributes?: PublishedMenuItem["attributes"];
  ingredientOptions?: IngredientOption[];
  toppingBaseImageUrl?: string;
  comboComponents?: PublishedMenuItem["comboComponents"];
  tags: string[];
  ingredientDetails?: Ingredient[];
  customization?: PizzaCustomization;
  presentation?: PublicPizzaPresentation;
  pizzaId?: string;
  categoryId?: string;
  additionalCategoryIds?: string[];
  cookTimeSeconds?: number;
};

/**
 * Match a published item against the bundled brand artwork so seeded and
 * demo menus render their cutout photo without any server-managed upload.
 * Admin-managed imageUrl always wins (handled by resolveProductImage).
 */
function bundledArtworkFor(name: string): string | null {
  const match = PIZZAS.find(
    (pizza) => pizza.name.toLowerCase() === name.trim().toLowerCase(),
  );
  if (!match) return null;
  const slug = match.id;
  return `/images/pizza-${slug}.png`;
}

export function mapPublishedItem(item: PublishedMenuItem): CatalogPizza {
  const tags = item.tags ?? [];
  const activePrices =
    item.customization?.variants
      .filter((v) => v.isActive)
      .map((v) => v.priceCents) ?? [];
  return {
    id: item.id,
    attributes: item.attributes,
    comboComponents: item.comboComponents,
    ingredientOptions: item.ingredientOptions ?? [],
    toppingBaseImageUrl: item.toppingBaseImageUrl,
    pizzaId: item.pizzaId,
    customization: item.customization,
    presentation: item.presentation,
    name: item.name,
    tagline: item.description || item.name,
    description: item.description || item.name,
    price:
      (activePrices.length ? Math.min(...activePrices) : item.priceCents) / 100,
    ingredients: item.ingredients ?? [],
    ingredientDetails: item.ingredientDetails ?? [],
    allergens: item.allergens ?? [],
    imageUrl: item.imageUrl ?? null,
    image:
      item.imageUrl?.trim() ||
      bundledArtworkFor(item.name) ||
      "/images/pizza-transparent.png",
    tags,
    categoryId: item.categoryId,
    additionalCategoryIds: item.additionalCategoryIds,
    cookTimeSeconds: item.cookTimeSeconds,
  };
}

export function useMenuCatalog() {
  const query = usePublishedMenuQuery();

  // A published-but-empty menu is valid operational data; only an actual
  // API failure is treated as an outage. Neither path shows mock products.
  const menuPayload = query.data;
  const fromApi = Boolean(menuPayload);
  const isOffline = query.isError;

  const items = useMemo<CatalogPizza[]>(() => {
    if (menuPayload?.items?.length) {
      return menuPayload.items.map(mapPublishedItem);
    }
    return [];
  }, [menuPayload]);

  const menuVersion = fromApi ? (menuPayload?.version?.version ?? 0) : 0;

  const getById = useMemo(() => {
    const map = new Map(items.map((item) => [item.id, item]));
    return (id: string) => map.get(id);
  }, [items]);

  return {
    items,
    menuVersion,
    fromApi,
    isOffline,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    categories: menuPayload?.categories ?? [],
    getById,
    refetch: query.refetch,
  };
}

// Kept for page-level snapshot/param helpers that still need the static id
// list; runtime screens must never render these as a catalog.
export { PIZZAS };

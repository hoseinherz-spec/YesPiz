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

import { mockPizzaImage, PIZZAS, type Pizza } from "@/constants/pizzas";

const PLACEHOLDER_IMAGE = mockPizzaImage;

export type CatalogPizza = Pizza & {
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

export function mapPublishedItem(item: PublishedMenuItem): CatalogPizza {
  const tags = item.tags ?? [];
  const activePrices =
    item.customization?.variants
      .filter((v) => v.isActive)
      .map((v) => v.priceCents) ?? [];
  const matchingPhoto = PIZZAS.find(
    (pizza) => pizza.name.toLowerCase() === item.name.trim().toLowerCase(),
  )?.image;
  return {
    id: item.id,
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
    image: matchingPhoto ?? PLACEHOLDER_IMAGE,
    tags,
    categoryId: item.categoryId,
    additionalCategoryIds: item.additionalCategoryIds,
    cookTimeSeconds: item.cookTimeSeconds,
  };
}

function toCatalogPizza(pizza: Pizza): CatalogPizza {
  return { ...pizza, tags: [] };
}

export function useMenuCatalog() {
  const query = usePublishedMenuQuery();

  const fromApi = Boolean(query.data?.items?.length);
  const isOffline = query.isError;

  const items = useMemo<CatalogPizza[]>(() => {
    if (fromApi && query.data) {
      return query.data.items.map(mapPublishedItem);
    }
    if (isOffline) {
      return PIZZAS.map(toCatalogPizza);
    }
    return [];
  }, [fromApi, isOffline, query.data]);

  const menuVersion = fromApi ? (query.data?.version?.version ?? 0) : 0;

  const getById = useMemo(() => {
    const map = new Map(items.map((item) => [item.id, item]));
    return (id: string) => {
      const hit = map.get(id);
      if (hit) return hit;
      if (isOffline || !fromApi) {
        const fallback = PIZZAS.find((p) => p.id === id);
        return fallback ? toCatalogPizza(fallback) : undefined;
      }
      return undefined;
    };
  }, [items, isOffline, fromApi]);

  return {
    items,
    menuVersion,
    fromApi,
    isOffline,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    categories: query.data?.categories ?? [],
    getById,
    refetch: query.refetch,
  };
}

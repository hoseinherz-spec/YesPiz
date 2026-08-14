'use client';

import {
  usePublishedMenuQuery,
  type PublishedMenuItem,
} from '@repo/api';
import { useMemo } from 'react';

import { PIZZAS, type Pizza } from '@/constants/pizzas';

const PLACEHOLDER_IMAGE = '/images/pizza-margherita.png';

export type CatalogPizza = Pizza & {
  tags: string[];
  categoryId?: string;
};

export function mapPublishedItem(item: PublishedMenuItem): CatalogPizza {
  const tags = item.tags ?? [];
  return {
    id: item.id,
    name: item.name,
    tagline: item.description || item.name,
    description: item.description || item.name,
    price: item.priceCents / 100,
    rating: 4.8,
    reviews: 120,
    prepTime: Math.max(15, Math.round(16 + (item.prepWeight || 1) * 4)),
    ingredients: tags.length
      ? tags.map((tag) => tag.charAt(0).toUpperCase() + tag.slice(1))
      : ['Signature'],
    imageUrl: item.imageUrl ?? null,
    image: PLACEHOLDER_IMAGE,
    tags,
    categoryId: item.categoryId,
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

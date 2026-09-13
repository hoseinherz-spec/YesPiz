"use client";

import { type PizzaSelection, apiRequest } from "@repo/api";
import React, {
  createContext,
  useCallback,
  useEffect,
  useContext,
  useMemo,
  useState,
} from "react";

import { EXTRAS, SIZES } from "@/constants/pizzas";

export type CartItem = {
  variantId?: string;
  selections?: PizzaSelection[];
  selectionLabels?: string[];
  lineId: string;
  menuItemId: string;
  menuVersion: number;
  name: string;
  size: "small" | "medium" | "large";
  extras: string[];
  quantity: number;
  unitPrice: number;
  image: string;
};

type CartContextValue = {
  sizes: typeof SIZES;
  extraOptions: typeof EXTRAS;
  baseDeliveryFee: number;
  items: CartItem[];
  addItem: (item: Omit<CartItem, "lineId">) => void;
  removeItem: (lineId: string) => void;
  updateQty: (lineId: string, delta: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  promoApplied: boolean;
  applyPromo: () => void;
  /** Menu version shared by cart lines (0 when empty / offline static). */
  menuVersion: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

const newId = () =>
  Date.now().toString() + Math.random().toString(36).slice(2, 11);

export function priceFor(
  base: number,
  size: CartItem["size"],
  extras: string[],
) {
  const sizeDelta = SIZES.find((s) => s.id === size)?.delta ?? 0;
  const extrasTotal = extras.reduce(
    (sum, id) => sum + (EXTRAS.find((e) => e.id === id)?.price ?? 0),
    0,
  );
  return base + sizeDelta + extrasTotal;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [pricing, setPricing] = useState<{
    deliveryFeeCents: number;
    sizes: Record<string, number>;
    extras: Record<string, number>;
  } | null>(null);
  useEffect(() => {
    void apiRequest<{
      deliveryFeeCents: number;
      sizes: Record<string, number>;
      extras: Record<string, number>;
    }>("/api/v1/delivery/options")
      .then(setPricing)
      .catch(() => undefined);
  }, []);
  const sizes = useMemo(
    () =>
      SIZES.map((size) => ({
        ...size,
        delta: pricing ? (pricing.sizes[size.id] ?? 0) / 100 : size.delta,
      })),
    [pricing],
  );
  const extraOptions = useMemo(
    () =>
      EXTRAS.map((extra) => ({
        ...extra,
        price: pricing ? (pricing.extras[extra.id] ?? 0) / 100 : extra.price,
      })),
    [pricing],
  );
  const baseDeliveryFee = pricing ? pricing.deliveryFeeCents / 100 : 2.99;
  const [items, setItems] = useState<CartItem[]>([]);
  const promoApplied = false;
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("yespizz_cart_v1") ?? "[]",
        );
        if (Array.isArray(saved))
          setItems(
            saved.filter(
              (item: CartItem) =>
                item.menuItemId &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                Number.isInteger(item.menuVersion) && item.menuVersion >= 0,
            ),
          );
      } catch {
        /* Storage is optional. */
      }
      setRestored(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (restored) {
      try {
        sessionStorage.setItem("yespizz_cart_v1", JSON.stringify(items));
      } catch {
        /* Storage is optional. */
      }
    }
  }, [items, restored]);

  const addItem = useCallback((item: Omit<CartItem, "lineId">) => {
    setItems((prev) => {
      if (prev.some((line) => line.menuVersion !== item.menuVersion)) prev = [];
      const match = prev.find(
        (p) =>
          p.menuItemId === item.menuItemId &&
          p.variantId === item.variantId &&
          JSON.stringify(p.selections ?? []) ===
            JSON.stringify(item.selections ?? []) &&
          p.size === item.size &&
          p.extras.slice().sort().join() === item.extras.slice().sort().join(),
      );
      if (match) {
        return prev.map((p) =>
          p.lineId === match.lineId
            ? { ...p, quantity: Math.min(99, p.quantity + item.quantity) }
            : p,
        );
      }
      return [...prev, { ...item, lineId: newId() }];
    });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((p) => p.lineId !== lineId));
  }, []);

  const updateQty = useCallback((lineId: string, delta: number) => {
    setItems((prev) =>
      prev
        .map((p) =>
          p.lineId === lineId
            ? { ...p, quantity: Math.min(99, p.quantity + delta) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const applyPromo = useCallback(() => undefined, []);

  const subtotal = useMemo(
    () => items.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0),
    [items],
  );
  const count = useMemo(
    () => items.reduce((sum, p) => sum + p.quantity, 0),
    [items],
  );
  const discount = 0;
  const deliveryFee = items.length ? baseDeliveryFee : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const menuVersion = items[0]?.menuVersion ?? 0;

  const value: CartContextValue = {
    sizes,
    extraOptions,
    baseDeliveryFee,
    items,
    addItem,
    removeItem,
    updateQty,
    clear,
    count,
    subtotal,
    deliveryFee,
    discount,
    total,
    promoApplied,
    applyPromo,
    menuVersion,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
